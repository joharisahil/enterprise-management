import httpx
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class SurepassService:
    def __init__(self):
        self.api_key = os.getenv("SURPASS_API_KEY")
        self.api_url = os.getenv("SURPASS_API_URL", "https://sandbox.surepass.app/api/v1/rc/rc-v2")
        self.challan_api_url = os.getenv("SURPASS_CHALLAN_API_URL", "https://sandbox.surepass.io/api/v1/rc/rc-related/challan-advanced")
        
    async def fetch_vehicle_details(self, registration_number: str) -> Dict[str, Any]:
        """
        Fetch vehicle details from Surepass RC v2 API
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Surepass API key not configured")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "id_number": registration_number,
            "enrich": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Surepass API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API returned status {response.status_code}",
                        "data": None
                    }
                
                data = response.json()
                
                if data.get("success"):
                    return {
                        "success": True,
                        "data": data.get("data"),
                        "raw_response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error"),
                        "data": None
                    }
                    
        except httpx.TimeoutException:
            logger.error("Surepass API timeout")
            return {
                "success": False,
                "error": "API request timeout",
                "data": None
            }
        except Exception as e:
            logger.error(f"Surepass API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    async def fetch_vehicle_challans(self, registration_number: str) -> Dict[str, Any]:
        """
        Fetch challan details for a vehicle from Surepass API
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Surepass API key not configured")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "rc_number": registration_number
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.challan_api_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Surepass Challan API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API returned status {response.status_code}",
                        "data": None
                    }
                
                data = response.json()
                
                if data.get("success"):
                    return {
                        "success": True,
                        "data": data.get("data", {}).get("challan_details", []),
                        "raw_response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error"),
                        "data": None
                    }
                    
        except httpx.TimeoutException:
            logger.error("Surepass Challan API timeout")
            return {
                "success": False,
                "error": "API request timeout",
                "data": None
            }
        except Exception as e:
            logger.error(f"Surepass Challan API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    def parse_vehicle_data(self, api_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Surepass API response into our vehicle model format
        """
        data = api_data.get("data", {})
        
        # Parse dates
        registration_date = None
        if data.get("registration_date"):
            try:
                registration_date = datetime.fromisoformat(data["registration_date"])
            except:
                registration_date = None
        
        insurance_expiry = None
        if data.get("insurance_upto"):
            try:
                insurance_expiry = datetime.fromisoformat(data["insurance_upto"])
            except:
                insurance_expiry = None
        
        puc_expiry = None
        if data.get("pucc_upto"):
            try:
                puc_expiry = datetime.fromisoformat(data["pucc_upto"])
            except:
                puc_expiry = None
        
        fit_up_to = None
        if data.get("fit_up_to"):
            try:
                fit_up_to = datetime.fromisoformat(data["fit_up_to"])
            except:
                fit_up_to = None
        
        tax_upto = None
        if data.get("tax_upto"):
            try:
                tax_upto = datetime.fromisoformat(data["tax_upto"])
            except:
                tax_upto = None
        
        # Parse manufacturer and model
        maker = data.get("maker_description", "")
        maker_model = data.get("maker_model", "")
        
        # Determine vehicle type based on category
        vehicle_category = data.get("vehicle_category_description", "").lower()
        vehicle_type = "Car"  # Default
        if "scooter" in vehicle_category or "motorcycle" in vehicle_category:
            vehicle_type = "Bike"
        elif "truck" in vehicle_category or "lorry" in vehicle_category:
            vehicle_type = "Truck"
        elif "bus" in vehicle_category:
            vehicle_type = "Bus"
        elif "tractor" in vehicle_category:
            vehicle_type = "Tractor"
        
        # Determine fuel type
        fuel = data.get("fuel_type", "").upper()
        fuel_type = "Petrol"  # Default
        if fuel == "DIESEL":
            fuel_type = "Diesel"
        elif fuel == "CNG":
            fuel_type = "CNG"
        elif fuel == "ELECTRIC":
            fuel_type = "Electric"
        
        return {
            "registration_number": data.get("rc_number", ""),
            "type": vehicle_type,
            "brand": maker.split()[0] if maker else "",
            "model": maker_model or "",
            "year": data.get("manufacturing_date", "")[-4:] if data.get("manufacturing_date") else None,
            "chassis_number": data.get("vehicle_chasi_number", ""),
            "engine_number": data.get("vehicle_engine_number", ""),
            "color": data.get("color", ""),
            "fuel_type": fuel_type,
            "seating_capacity": data.get("seat_capacity"),
            "owner_name": data.get("owner_name", ""),
            "date_of_registration": registration_date,
            "insurance_expiry": insurance_expiry,
            "puc_expiry": puc_expiry,
            "fit_up_to": fit_up_to,
            "tax_upto": tax_upto,
            "insurance_company": data.get("insurance_company", ""),
            "insurance_policy_number": data.get("insurance_policy_number", ""),
            "pucc_number": data.get("pucc_number", ""),
            "registered_at": data.get("registered_at", ""),
            "source": "surepass"
        }
    
    def parse_challan_data(self, challan_data: Dict[str, Any], vehicle_id: str) -> Dict[str, Any]:
        """
        Parse Surepass challan data into our challan model format
        """
        # Parse date
        challan_date = None
        if challan_data.get("challan_date"):
            try:
                challan_date = datetime.fromisoformat(challan_data["challan_date"])
            except:
                try:
                    # Try parsing with time
                    if challan_data.get("challan_date_time"):
                        date_str = challan_data["challan_date_time"].replace('Z', '+00:00')
                        challan_date = datetime.fromisoformat(date_str)
                except:
                    challan_date = None
        
        # If no date found, use current date
        if not challan_date:
            challan_date = datetime.now()
        
        # Determine status
        status = challan_data.get("challan_status", "Pending")
        # Map to our PaymentStatus enum
        if status.lower() in ["disposed", "paid", "closed"]:
            mapped_status = "Paid"
        else:
            mapped_status = "Unpaid"
        
        # Get challan number (handle different field names)
        challan_number = challan_data.get("challallan_number") or challan_data.get("challan_number") or f"CH-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Get offense details - combine all offenses if multiple
        offense_details = challan_data.get("offense_details", "Traffic Violation")
        offense_list = challan_data.get("offense_details_list", [])
        
        if offense_list and len(offense_list) > 0:
            offenses = [o.get("offense_name", "") for o in offense_list if o.get("offense_name")]
            if offenses:
                offense_details = ", ".join(offenses[:3])  # Combine first 3 offenses
                if len(offenses) > 3:
                    offense_details += f" and {len(offenses)-3} more"
        
        # Get amount (handle string or float)
        amount = 0
        if challan_data.get("amount"):
            try:
                amount = float(challan_data.get("amount", 0))
            except:
                amount = 0
        
        return {
            "vehicle_id": vehicle_id,
            "challan_number": challan_number,
            "date": challan_date.isoformat(),
            "violation_type": offense_details,
            "amount": amount,
            "status": mapped_status,
            "location": challan_data.get("challan_place", ""),
            "accused_name": challan_data.get("accused_name", ""),
            "state": challan_data.get("state", ""),
            "rto": challan_data.get("rto", ""),
            "court_challan": challan_data.get("court_challan", False),
            "court_name": challan_data.get("court_name", ""),
            "source": "surepass",
            "proof_url": None,
            "phone_number": None,
            "driver_id": None,
            "payment_date": None
        }
    
    def check_document_status(self, expiry_date: Optional[datetime]) -> Dict[str, Any]:
        """
        Check if a document needs update based on expiry
        Returns: status and whether API call is needed
        """
        if not expiry_date:
            return {
                "status": "NOT_AVAILABLE",
                "needs_update": True,
                "days_left": None
            }
        
        today = datetime.now(timezone.utc)
        days_left = (expiry_date - today).days
        
        if days_left <= 0:
            status = "EXPIRED"
            needs_update = True  # Definitely need update if expired
        elif days_left <= 30:
            status = "EXPIRING_SOON"
            needs_update = True  # Update if expiring within 30 days
        else:
            status = "VALID"
            needs_update = False  # No need to update if valid for >30 days
        
        return {
            "status": status,
            "needs_update": needs_update,
            "days_left": days_left
        }