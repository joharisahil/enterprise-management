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
        self.api_url = os.getenv("SURPASS_API_URL", "https://kyc-api.surepass.app/api/v1/rc/rc-v2")
        self.challan_api_url = os.getenv("SURPASS_CHALLAN_API_URL", "https://kyc-api.surepass.app/api/v1/rc/rc-related/challan-advanced")
        self.fastag_verification_url = os.getenv("SURPASS_FASTAG_VERIFICATION_URL", "https://kyc-api.surepass.app/api/v1/fastag/fastag-verification-v2")
        self.fastag_balance_url = os.getenv("SURPASS_FASTAG_BALANCE_URL", "https://kyc-api.surepass.app/api/v1/fastag/rc-to-fastag-balance")
        
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
    
    def check_document_status(self, expiry_date) -> Dict[str, Any]:
        """
        Check if a document needs update based on expiry
        Returns: status and whether API call is needed
        """
        # Convert to datetime if it's a string
        if isinstance(expiry_date, str):
            try:
                expiry_date = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
            except:
                try:
                    # Try parsing without timezone
                    expiry_date = datetime.fromisoformat(expiry_date)
                except:
                    expiry_date = None
        
        if not expiry_date:
            return {
                "status": "NOT_AVAILABLE",
                "needs_update": True,
                "days_left": None
            }
        
        today = datetime.now(timezone.utc)
        # Make expiry_date timezone-aware if it's naive
        if expiry_date.tzinfo is None:
            expiry_date = expiry_date.replace(tzinfo=timezone.utc)
        
        days_left = (expiry_date - today).days
        
        if days_left <= 0:
            status = "EXPIRED"
            needs_update = True
        elif days_left <= 30:
            status = "EXPIRING_SOON"
            needs_update = True
        else:
            status = "VALID"
            needs_update = False
        
        return {
            "status": status,
            "needs_update": needs_update,
            "days_left": days_left
        }

    async def fetch_fastag_details(self, rc_number: str):
        """
        Fetch FASTag details including balance and transactions
        """
        try:
            if not self.api_key:
                logger.error("SURPASS_API_KEY not configured")
                return {
                    "success": False,
                    "error": "API key not configured"
                }
            
            # First API: Get FASTag verification details with transactions
            verification_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            verification_payload = {
                "rc_number": rc_number
            }
            
            logger.info(f"Fetching FASTag verification for RC: {rc_number}")
            logger.info(f"Verification URL: {self.fastag_verification_url}")
            logger.info(f"Verification Payload: {verification_payload}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.fastag_verification_url,
                    json=verification_payload,
                    headers=verification_headers
                )
                
                logger.info(f"Verification API response status: {response.status_code}")
                logger.info(f"Verification API response body: {response.text}")
                
                if response.status_code != 200:
                    logger.error(f"FASTag verification API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code} - {response.text}"
                    }
                
                verification_data = response.json()
                
                if not verification_data.get("success"):
                    logger.error(f"FASTag verification unsuccessful: {verification_data}")
                    return {
                        "success": False,
                        "error": verification_data.get("message", "Failed to fetch FASTag details")
                    }
                
                # Get the provider name from verification response
                bank_name = verification_data.get("data", {}).get("bank_name")
                tag_id = verification_data.get("data", {}).get("tag_id")
                
                logger.info(f"Bank name from verification: {bank_name}, Tag ID: {tag_id}")
                
                # If no bank name, return just the verification data
                if not bank_name:
                    logger.warning(f"No bank name found for RC: {rc_number}")
                    return {
                        "success": True,
                        "data": {
                            "rc_number": rc_number,
                            "tag_id": tag_id,
                            "bank_name": None,
                            "tag_status": verification_data.get("data", {}).get("status", "Unknown"),
                            "transactions": verification_data.get("data", {}).get("transactions", []),
                            "available_balance": None,
                            "available_recharge_limit": None,
                            "customer_name": None,
                            "vehicle_class": None,
                            "vehicle_class_desc": None
                        }
                    }
                
                # Map bank name to provider name for second API
                provider_mapping = {
                    "IDFC First Bank": "idfc_first_bank",
                    "HDFC Bank": "hdfc_bank",
                    "ICICI Bank": "icici_bank",
                    "Axis Bank": "axis_bank",
                    "SBI": "sbi",
                    "Paytm": "paytm"
                }
                
                provider_name = provider_mapping.get(bank_name, "idfc_first_bank")
                
                # Second API: Get balance details
                balance_headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                balance_payload = {
                    "rc_number": rc_number,
                    "provider_name": provider_name
                }
                
                logger.info(f"Fetching FASTag balance for RC: {rc_number} with provider: {provider_name}")
                logger.info(f"Balance Payload: {balance_payload}")
                logger.info(f"Balance URL: {self.fastag_balance_url}")
                
                balance_response = await client.post(
                    self.fastag_balance_url,
                    json=balance_payload,
                    headers=balance_headers
                )
                
                logger.info(f"Balance API response status: {balance_response.status_code}")
                logger.info(f"Balance API response body: {balance_response.text}")
                
                balance_data = {}
                if balance_response.status_code == 200:
                    try:
                        balance_data = balance_response.json()
                        logger.info(f"Balance data parsed successfully")
                    except Exception as e:
                        logger.error(f"Failed to parse balance response: {e}")
                        balance_data = {}
                else:
                    logger.warning(f"Balance API returned non-200 status: {balance_response.status_code}")
                
                # Combine both responses
                result = {
                    "success": True,
                    "data": {
                        "rc_number": rc_number,
                        "tag_id": tag_id,
                        "bank_name": bank_name,
                        "provider_code": balance_data.get("data", {}).get("provider_code"),
                        "customer_name": balance_data.get("data", {}).get("customer_name"),
                        "available_balance": balance_data.get("data", {}).get("available_balance"),
                        "available_recharge_limit": balance_data.get("data", {}).get("available_recharge_limit"),
                        "tag_status": balance_data.get("data", {}).get("tag_status", verification_data.get("data", {}).get("status", "Unknown")),
                        "vehicle_class": balance_data.get("data", {}).get("vehicle_class"),
                        "vehicle_class_desc": balance_data.get("data", {}).get("vehicle_class_desc"),
                        "transactions": verification_data.get("data", {}).get("transactions", [])
                    }
                }
                
                logger.info(f"Successfully fetched FASTag details for {rc_number}")
                return result
                
        except Exception as e:
            logger.error(f"Error fetching FASTag details: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

    async def fetch_fastag_transactions(self, rc_number: str):
        """
        Fetch only FASTag transaction details
        """
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "API key not configured"
                }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "rc_number": rc_number
            }
            
            logger.info(f"Fetching FASTag transactions for RC: {rc_number}")
            logger.info(f"Transaction URL: {self.fastag_verification_url}")
            logger.info(f"Transaction Payload: {payload}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.fastag_verification_url,
                    json=payload,
                    headers=headers
                )
                
                logger.info(f"Transaction API response status: {response.status_code}")
                logger.info(f"Transaction API response body: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code} - {response.text}"
                    }
                
                data = response.json()
                
                if not data.get("success"):
                    return {
                        "success": False,
                        "error": data.get("message", "Failed to fetch transactions")
                    }
                
                transactions = data.get("data", {}).get("transactions", [])
                tag_id = data.get("data", {}).get("tag_id")
                bank_name = data.get("data", {}).get("bank_name")
                status = data.get("data", {}).get("status")
                
                logger.info(f"Found {len(transactions)} transactions for RC: {rc_number}")
                
                return {
                    "success": True,
                    "data": {
                        "tag_id": tag_id,
                        "bank_name": bank_name,
                        "status": status,
                        "transactions": transactions,
                        "transaction_count": len(transactions)
                    }
                }
                
        except Exception as e:
            logger.error(f"Error fetching FASTag transactions: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }