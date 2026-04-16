import httpx
from datetime import datetime, timezone , timedelta


class TrackingService:
    def __init__(self, db):
        self.db = db
        self.base_url = "http://43.204.20.184/webservice"
        self.username = "HSCPL"
        self.password = "123456"
        self.project_id = 16
        self.token = None
        self.token_expiry = None

    # 🔹 SAFE PARSERS
    def safe_int(self, val):
        try:
            return int(val)
        except:
            return 0

    def safe_float(self, val):
        try:
            return float(val)
        except:
            return 0.0

    # 🔹 TOKEN GENERATION
    async def generate_token(self):
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{self.base_url}?token=generateAccessToken",
                    json={
                        "username": self.username,
                        "password": self.password
                    }
                )

                if res.status_code != 200:
                    print("❌ Token API Error:", res.text)
                    return

                data = res.json()
                self.token = data.get("data", {}).get("token")
                self.token_expiry = datetime.now(timezone.utc)

                print("✅ Token generated")

        except Exception as e:
            print("❌ Token generation failed:", e)

    # 🔹 GET TOKEN (AUTO REFRESH)
    async def get_token(self):
        if (
            not self.token
            or not self.token_expiry
            or (datetime.now(timezone.utc) - self.token_expiry).seconds > 1500
        ):
            await self.generate_token()

        return self.token

    # 🔹 FETCH LIVE DATA
    async def fetch_live_data(self):
        try:
            token = await self.get_token()

            if not token:
                print("❌ No token available")
                return

            # 🔹 Get IMEIs
            devices = await self.db.gps_devices.find(
                {"is_active": True},
                {"imei": 1, "vehicle_id": 1}
            ).to_list(1000)

            # map IMEI → vehicle_id
            imei_map = {d["imei"]: d["vehicle_id"] for d in devices if d.get("imei")}

            imeis = ",".join(imei_map.keys())

            if not imeis:
                print("⚠️ No IMEIs found")
                return

            async with httpx.AsyncClient() as client:
                res = await client.post(
                    
                    f"{self.base_url}?token=getTokenBaseLiveData&ProjectId={self.project_id}",
                    headers={"auth-code": token},
                    json={
                        "company_names": "H S Construction",
                        "imei_nos": imeis,
                        "format": "json"
                    }
                )
                # ✅ NOW print here
                print("📡 RAW RESPONSE STATUS:", res.status_code)
                print("📡 RAW RESPONSE TEXT:", res.text)

                if res.status_code != 200:
                    print("❌ Live API Error:", res.text)
                    return

                try:
                    data = res.json()
                except Exception:
                    print("❌ Invalid JSON response")
                    return

                await self.process_data(data, imei_map)

        except Exception as e:
            print("❌ Fetch error:", e)

    # 🔹 PROCESS DATA
    async def process_data(self, data, imei_map):
        vehicles = data.get("root", {}).get("VehicleData", [])
        

        print("🚀 Total vehicles from API:", len(vehicles))
        print("📦 IMEIs in DB:", list(imei_map.keys()))

        for v in vehicles:
            imei = v.get("Imeino")

            print("\n👉 Processing IMEI from API:", imei)

            # 🔴 Skip invalid IMEI
            if not imei:
                print("❌ IMEI is None, skipping")
                continue

            # 🔴 Check if IMEI exists in DB
            if imei not in imei_map:
                print("❌ IMEI NOT FOUND IN DB:", imei)
                continue

            print("✅ IMEI matched in DB")

            record = {
                "imei": imei,
                "vehicle_id": imei_map.get(imei),
                "vehicle_no": v.get("Vehicle_No"),
                "lat": self.safe_float(v.get("Latitude")),
                "lng": self.safe_float(v.get("Longitude")),
                "speed": self.safe_int(v.get("Speed")),
                "status": v.get("Status"),
                "ignition": v.get("IGN"),

                
                "location": v.get("Location"),
                "angle": self.safe_int(v.get("Angle")),
                "satellite_count": v.get("satellite_count"),
                "battery": v.get("battery_percentage"),
                "external_voltage": self.safe_float(v.get("ExternalVolt")),  
                "gps_time": v.get("GPSActualTime"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "expire_at": datetime.now(timezone.utc) + timedelta(days=20)##this 20 sets day expire value

            }

            ##print("📍 Record to save:", record)

            try:
                # 🔹 DUPLICATE CHECK
                last = await self.db.vehicle_history.find_one(
                    {"imei": imei},
                    sort=[("timestamp", -1)]
                )

                if last:
                    if last.get("lat") == record["lat"] and last.get("lng") == record["lng"]:
                        print("⚠️ Duplicate, skipping")
                        continue
                else:
                    print("🔥 First record — inserting")

                # 🔹 LIVE COLLECTION
                await self.db.vehicle_live.update_one(
                    {"imei": imei},
                    {"$set": record},
                    upsert=True
                )

                # 🔹 HISTORY COLLECTION
                await self.db.vehicle_history.insert_one(record)

                print(f"✅ Saved data for IMEI: {imei}")

            except Exception as e:
                print(f"❌ DB Error for IMEI {imei}:", e)
    
    async def setup_ttl_index(self):
        """Create TTL index to auto-delete records after 28 days"""
        try:
            # Create TTL index on expire_at field
            await self.db.vehicle_history.create_index(
                [("expire_at", 1)],
                expireAfterSeconds=0,  # 0 means delete when expire_at time is reached
                name="ttl_expire_at_28d"
            )
            print("✅ TTL index created - records will auto-delete after 28 days")
        except Exception as e:
            print("❌ Failed to create TTL index:", e)
    
    # in case needed for some debugging
    # async def cleanup_old_records(self, days=20):
    #     """Delete old records and print result"""
    #     try:
    #         cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            
    #         # ✅ ADD THESE DEBUG PRINTS
    #         print(f"🧹 Running cleanup check... (cutoff: {cutoff.strftime('%Y-%m-%d %H:%M:%S')})")
            
    #         # Count old records before deletion
    #         old_count = await self.db.vehicle_history.count_documents({"expire_at": {"$lt": cutoff}})
    #         total_count = await self.db.vehicle_history.count_documents({})
            
    #         print(f"📊 Total records: {total_count}, Old records: {old_count}")
            
    #         if old_count > 0:
    #             result = await self.db.vehicle_history.delete_many(
    #                 {"expire_at": {"$lt": cutoff}}
    #             )
    #             print(f"🗑️ Deleted {result.deleted_count} old records (older than {days} days)")
    #         else:
    #             print(f"✨ No old records to delete (TTL may have already deleted them)")
            
    #     except Exception as e:
    #         print(f"❌ Cleanup error: {e}")