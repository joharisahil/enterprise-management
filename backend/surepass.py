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
        
        # IMPROVED: Determine payment status from multiple possible fields
        status = "Unpaid"
        payment_date = None
        
        # Check various status fields from the API response
        challan_status = str(challan_data.get("challan_status", "")).lower()
        payment_status = str(challan_data.get("payment_status", "")).lower()
        status_field = str(challan_data.get("status", "")).lower()
        is_paid = str(challan_data.get("is_paid", "")).lower()
        
        # Check if there's a payment date
        if challan_data.get("payment_date"):
            try:
                pay_date_str = challan_data.get("payment_date")
                if isinstance(pay_date_str, str):
                    if 'T' in pay_date_str:
                        payment_date = datetime.fromisoformat(pay_date_str.replace('Z', '+00:00'))
                    else:
                        payment_date = datetime.fromisoformat(pay_date_str)
                else:
                    payment_date = pay_date_str
                status = "Paid"
            except Exception as e:
                logger.warning(f"Could not parse payment date: {e}")
        
        # Check status indicators if no payment date found
        if status == "Unpaid":
            # List of status values that indicate paid
            paid_indicators = ["paid", "disposed", "closed", "settled", "success", "completed"]
            unpaid_indicators = ["pending", "unpaid", "open", "active"]
            
            # Check all possible status fields
            for status_value in [challan_status, payment_status, status_field, is_paid]:
                if status_value in paid_indicators:
                    status = "Paid"
                    # If we don't have a payment date, use current date as payment date
                    if not payment_date:
                        payment_date = datetime.now()
                    break
                elif status_value in unpaid_indicators:
                    status = "Unpaid"
        
        # Also check for amount_paid field
        amount_paid = challan_data.get("amount_paid", 0)
        if amount_paid and float(amount_paid) > 0:
            status = "Paid"
            if not payment_date:
                payment_date = datetime.now()
        
        # Get challan number (handle different field names)
        challan_number = (
            challan_data.get("challallan_number") or 
            challan_data.get("challan_number") or 
            challan_data.get("challan_no") or
            challan_data.get("challanId") or
            f"CH-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        )
        
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
        
        # Get location
        location = (
            challan_data.get("challan_place") or 
            challan_data.get("location") or 
            challan_data.get("place_of_offence") or
            challan_data.get("address", "")
        )
        
        # Get phone number if available
        phone_number = (
            challan_data.get("mobile_number") or 
            challan_data.get("phone") or 
            challan_data.get("phone_number")
        )
        
        # Get proof/document URL if available
        proof_url = (
            challan_data.get("document_url") or 
            challan_data.get("challan_image") or
            challan_data.get("proof_url")
        )
        
        return {
            "vehicle_id": vehicle_id,
            "challan_number": challan_number,
            "date": challan_date.isoformat(),
            "violation_type": offense_details,
            "amount": amount,
            "status": status,
            "location": location,
            "accused_name": challan_data.get("accused_name", ""),
            "state": challan_data.get("state", ""),
            "rto": challan_data.get("rto", ""),
            "court_challan": challan_data.get("court_challan", False),
            "court_name": challan_data.get("court_name", ""),
            "source": "surepass",
            "proof_url": proof_url,
            "phone_number": phone_number,
            "driver_id": None,
            "payment_date": payment_date.isoformat() if payment_date else None
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
        
    async def fetch_electricity_bill(self, consumer_id: str, operator_code: str) -> Dict[str, Any]:
        """
        Fetch electricity bill details from Surepass API
    
        Args:
            consumer_id: Electricity consumer ID/number
            operator_code: State operator code (e.g., "MH" for Maharashtra)
    
        Returns:
            Dictionary with bill details
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Surepass API key not configured")
    
        electricity_api_url = os.getenv("SURPASS_ELECTRICITY_API_URL", "https://kyc-api.surepass.app/api/v1/utility/electricity/")
    
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        # Clean the consumer_id - remove any spaces or special characters
        cleaned_consumer_id = consumer_id.strip()
    
        # Ensure operator_code is uppercase
        cleaned_operator_code = operator_code.upper().strip()
         
        # Validate operator_code length (should be 2 characters like MH, DL, etc.)
        if len(cleaned_operator_code) != 2:
            logger.warning(f"Operator code {cleaned_operator_code} is not 2 characters long") 
    
        payload = {
            "id_number": cleaned_consumer_id,
            "operator_code": cleaned_operator_code
        }
        logger.info(f"Electricity bill API request payload: {payload}")
        logger.info(f"Electricity bill API URL: {electricity_api_url}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    electricity_api_url,
                    json=payload,
                    headers=headers
                )
            
                if response.status_code != 200:
                    logger.error(f"Electricity bill API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API returned status {response.status_code}",
                        "data": None
                    }
            
                data = response.json()
            
                if data.get("success"):
                    # Parse the bill amount (remove commas)
                    bill_amount_str = data.get("data", {}).get("bill_amount", "0")
                    bill_amount = float(bill_amount_str.replace(",", "")) if bill_amount_str else 0
                    customer_id = data.get("data", {}).get("customer_id") or data.get("data", {}).get("consumer_id")
                    return {
                        "success": True,
                        "data": {
                            "consumer_id": customer_id,
                            "full_name": data.get("data", {}).get("full_name"),
                            "address": data.get("data", {}).get("address"),
                            "mobile": data.get("data", {}).get("mobile"),
                            "email": data.get("data", {}).get("user_email"),
                            "bill_amount": bill_amount,
                            "bill_number": data.get("data", {}).get("bill_number"),
                            "operator_code": data.get("data", {}).get("operator_code"),
                            "state": data.get("data", {}).get("state"),
                            "document_link": data.get("data", {}).get("document_link"),
                            "client_id": data.get("data", {}).get("client_id")
                        },
                        "raw_response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error"),
                        "data": None
                    }
                
        except httpx.TimeoutException:
            logger.error("Electricity bill API timeout")
            return {
                "success": False,
                "error": "API request timeout",
                "data": None
            }
        except Exception as e:
            logger.error(f"Electricity bill API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }

    # Add to surepass.py inside SurepassService class

    async def fetch_gas_bill(self, mobile_number: str, provider_name: str) -> Dict[str, Any]:
        """
        Fetch gas connection details from Surepass API
    
        Args:
            mobile_number: Registered mobile number for gas connection
            provider_name: Gas provider name (e.g., "indane", "bharat_gas", "hp_gas")
    
        Returns:
            Dictionary with gas connection details
        """
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Surepass API key not configured")
    
        gas_api_url = os.getenv("SURPASS_GAS_API_URL", "https://kyc-api.surepass.app/api/v1/gas-connection/verify")
    
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
        payload = {
            "mobile_number": mobile_number,
            "provider_name": provider_name
        }
    
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    gas_api_url,
                    json=payload,
                    headers=headers
                )
            
                if response.status_code != 200:
                    logger.error(f"Gas bill API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API returned status {response.status_code}",
                        "data": None
                    }
            
                data = response.json()
            
                if data.get("success"):
                    # Parse the response based on provider
                    provider_data = data.get("data", {}).get(f"{provider_name}_gas", {})
                
                    # Get consumer details
                    consumer_details = provider_data.get("consumer_details", {})
                    distributor_details = provider_data.get("distributor_details", {})
                    consumer_address = consumer_details.get("consumer_address", {})
                    distributor_address = distributor_details.get("distributor_address", {})
                
                    return {
                        "success": True,
                        "data": {
                            "consumer_id": provider_data.get("consumer_id"),
                            "consumer_number": provider_data.get("consumer_number"),
                            "consumer_name": provider_data.get("consumer_name"),
                            "mobile_number": data.get("data", {}).get("mobile_number"),
                            "provider_name": provider_name,
                            "consumer_status": consumer_details.get("consumer_status"),
                            "consumer_type": consumer_details.get("consumer_type"),
                            "consumer_category": consumer_details.get("consumer_category"),
                            "address": f"{consumer_address.get('line_1', '')}, {consumer_address.get('line_2', '')}, {consumer_address.get('city', '')}, {consumer_address.get('district', '')}, {consumer_address.get('state', '')} - {consumer_address.get('pin_code', '')}",
                            "district": consumer_address.get("district"),
                            "state": consumer_address.get("state"),
                            "pin_code": consumer_address.get("pin_code"),
                            "distributor_name": distributor_details.get("distributor_name"),
                            "distributor_code": distributor_details.get("distributor_code"),
                            "distributor_contact": distributor_details.get("distributor_contact"),
                            "distributor_address": f"{distributor_address.get('address_line_1', '')}, {distributor_address.get('address_line_2', '')}, {distributor_address.get('city', '')}, {distributor_address.get('district', '')}, {distributor_address.get('state', '')} - {distributor_address.get('pin_code', '')}",
                            "mi_due_date": consumer_details.get("mi_due_date"),
                            "tube_change_due_date": consumer_details.get("tube_change_due_date")
                        },
                        "raw_response": data
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("message", "Unknown error"),
                        "data": None
                    }
                
        except httpx.TimeoutException:
            logger.error("Gas bill API timeout")
            return {
                "success": False,
                "error": "API request timeout",
                "data": None
            }
        except Exception as e:
            logger.error(f"Gas bill API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }        