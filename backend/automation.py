from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
from models import *
from motor.motor_asyncio import AsyncIOMotorDatabase

class AutomationService:
    """Background automation service for compliance checks and alerts"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def check_expiring_documents(self) -> list:
        """Check for expiring vehicle documents and generate alerts"""
        alerts = []
        now = datetime.now(timezone.utc)
        
        # Check dates: 60 days, 30 days, 7 days, and expired
        check_periods = [
            {"days": 60, "severity": "info", "label": "60 days"},
            {"days": 30, "severity": "warning", "label": "30 days"},
            {"days": 7, "severity": "critical", "label": "7 days"},
            {"days": 0, "severity": "critical", "label": "expired"}
        ]
        
        for period in check_periods:
            threshold = now + timedelta(days=period["days"])
            
            if period["days"] == 0:
                # Check expired
                query = {"expiry_date": {"$lt": now}, "is_current": True, "is_deleted": False}
            else:
                # Check expiring soon
                query = {
                    "expiry_date": {"$lte": threshold, "$gt": now},
                    "is_current": True,
                    "is_deleted": False
                }
            
            docs = await self.db.vehicle_documents.find(query).to_list(1000)
            
            for doc in docs:
                alert = {
                    "id": str(uuid.uuid4()),
                    "type": "document_expiry",
                    "title": f"Document {period['label']} alert",
                    "message": f"{doc['document_type']} for vehicle {doc['vehicle_id']} expires on {doc['expiry_date'].strftime('%Y-%m-%d')}",
                    "severity": period["severity"],
                    "resource_type": "vehicle_document",
                    "resource_id": doc["id"],
                    "is_read": False,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                    "is_deleted": False
                }
                alerts.append(alert)
                # Insert into notifications collection
                await self.db.notifications.insert_one(alert)
        
        return alerts
    
    async def check_expiring_taxes(self) -> list:
        """Check for expiring property taxes"""
        alerts = []
        now = datetime.now(timezone.utc)
        
        check_periods = [
            {"days": 30, "severity": "warning"},
            {"days": 7, "severity": "critical"},
            {"days": 0, "severity": "critical"}
        ]
        
        for period in check_periods:
            threshold = now + timedelta(days=period["days"])
            
            if period["days"] == 0:
                query = {"expiry_date": {"$lt": now}, "status": "Unpaid", "is_deleted": False}
            else:
                query = {
                    "expiry_date": {"$lte": threshold, "$gt": now},
                    "status": "Unpaid",
                    "is_deleted": False
                }
            
            taxes = await self.db.property_taxes.find(query).to_list(1000)
            
            for tax in taxes:
                alert = {
                    "id": str(uuid.uuid4()),
                    "type": "tax_expiry",
                    "title": f"Tax Payment Due",
                    "message": f"{tax['tax_type']} for property {tax['property_id']} due on {tax['expiry_date'].strftime('%Y-%m-%d')}",
                    "severity": period["severity"],
                    "resource_type": "property_tax",
                    "resource_id": tax["id"],
                    "is_read": False,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                    "is_deleted": False
                }
                alerts.append(alert)
                await self.db.notifications.insert_one(alert)
        
        return alerts
    
    async def check_utility_bills_due(self) -> list:
        """Check for upcoming utility bill due dates"""
        alerts = []
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(days=7)
        
        collections = [
            {"name": "electricity_bills", "type": "Electricity Bill"},
            {"name": "gas_bills", "type": "Gas Bill"},
            {"name": "water_bills", "type": "Water Bill"}
        ]
        
        for collection in collections:
            query = {
                "due_date": {"$lte": threshold, "$gte": now},
                "status": "Unpaid",
                "is_deleted": False
            }
            
            bills = await self.db[collection["name"]].find(query).to_list(1000)
            
            for bill in bills:
                alert = {
                    "id": str(uuid.uuid4()),
                    "type": "bill_due",
                    "title": f"{collection['type']} Due Soon",
                    "message": f"{collection['type']} for property {bill['property_id']} due on {bill['due_date'].strftime('%Y-%m-%d')}",
                    "severity": "warning",
                    "resource_type": collection["name"],
                    "resource_id": bill["id"],
                    "is_read": False,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                    "is_deleted": False
                }
                alerts.append(alert)
                await self.db.notifications.insert_one(alert)
        
        return alerts
    
    async def check_abnormal_consumption(self) -> list:
        """Detect abnormal utility consumption spikes"""
        alerts = []
        
        # Get recent electricity bills for each property
        properties = await self.db.properties.find({"is_deleted": False}).to_list(1000)
        
        for prop in properties:
            bills = await self.db.electricity_bills.find(
                {"property_id": prop["id"], "is_deleted": False}
            ).sort("billing_period_start", -1).limit(3).to_list(3)
            
            if len(bills) >= 2:
                latest = bills[0]
                previous = bills[1]
                
                # Check if consumption increased by more than 30%
                if previous["units_consumed"] > 0:
                    increase_pct = ((latest["units_consumed"] - previous["units_consumed"]) / previous["units_consumed"]) * 100
                    
                    if increase_pct > 30:
                        alert = {
                            "id": str(uuid.uuid4()),
                            "type": "abnormal_consumption",
                            "title": "Abnormal Consumption Detected",
                            "message": f"Electricity consumption for property {prop['name']} increased by {increase_pct:.1f}%",
                            "severity": "warning",
                            "resource_type": "electricity_bill",
                            "resource_id": latest["id"],
                            "is_read": False,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                            "is_deleted": False
                        }
                        alerts.append(alert)
                        await self.db.notifications.insert_one(alert)
        
        return alerts
    
    async def check_driver_license_expiry(self) -> list:
        """Check for expiring driver licenses"""
        alerts = []
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(days=30)
        
        query = {
            "license_expiry": {"$lte": threshold},
            "is_deleted": False
        }
        
        drivers = await self.db.drivers.find(query).to_list(1000)
        
        for driver in drivers:
            days_left = (driver["license_expiry"] - now).days
            severity = "critical" if days_left <= 7 else "warning"
            
            alert = {
                "id": str(uuid.uuid4()),
                "type": "license_expiry",
                "title": "Driver License Expiring",
                "message": f"License for {driver['full_name']} expires in {days_left} days",
                "severity": severity,
                "resource_type": "driver",
                "resource_id": driver["id"],
                "is_read": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "is_deleted": False
            }
            alerts.append(alert)
            await self.db.notifications.insert_one(alert)
        
        return alerts
    
    async def run_all_checks(self) -> dict:
        """Run all automation checks"""
        print(f"[AUTOMATION] Running compliance checks at {datetime.now(timezone.utc)}")
        
        doc_alerts = await self.check_expiring_documents()
        tax_alerts = await self.check_expiring_taxes()
        bill_alerts = await self.check_utility_bills_due()
        consumption_alerts = await self.check_abnormal_consumption()
        license_alerts = await self.check_driver_license_expiry()
        
        total_alerts = len(doc_alerts) + len(tax_alerts) + len(bill_alerts) + len(consumption_alerts) + len(license_alerts)
        
        print(f"[AUTOMATION] Generated {total_alerts} alerts")
        
        return {
            "total_alerts": total_alerts,
            "document_alerts": len(doc_alerts),
            "tax_alerts": len(tax_alerts),
            "bill_alerts": len(bill_alerts),
            "consumption_alerts": len(consumption_alerts),
            "license_alerts": len(license_alerts)
        }
