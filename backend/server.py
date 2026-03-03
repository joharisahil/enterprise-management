from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Optional
import asyncio

from models import *
from auth import get_password_hash, verify_password, create_access_token, get_current_user, check_role
from telematics import get_telematics_provider, TelematicsService
from automation import AutomationService

# Helper function to convert datetime objects to ISO strings
def serialize_doc(doc):
    """Convert datetime objects in a dict to ISO format strings for JSON serialization"""
    if isinstance(doc, dict):
        # Remove MongoDB's _id field if present
        result = {k: v for k, v in doc.items() if k != '_id'}
        # Convert datetime objects to ISO strings
        return {k: v.isoformat() if isinstance(v, datetime) else v for k, v in result.items()}
    return doc

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Global services
telematics_service = TelematicsService(get_telematics_provider("Simulation"))
automation_service = None

# Background task for automation
async def automation_background_task():
    """Run automation checks periodically"""
    while True:
        try:
            await automation_service.run_all_checks()
        except Exception as e:
            logging.error(f"Automation task error: {e}")
        # Run every 6 hours
        await asyncio.sleep(6 * 60 * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global automation_service
    automation_service = AutomationService(db)
    # Start background task
    task = asyncio.create_task(automation_background_task())
    logging.info("Application started, automation task running")
    yield
    # Shutdown
    task.cancel()
    client.close()
    logging.info("Application shutdown")

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email, "is_deleted": False})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=user_data.is_active,
        hashed_password=get_password_hash(user_data.password)
    )
    
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return {"id": user_id, "email": user.email, "role": user.role}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email, "is_deleted": False})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    token = create_access_token({"user_id": user["id"], "email": user["email"], "role": user["role"]})
    
    return {"access_token": token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"], "is_deleted": False}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== PROPERTY ROUTES ====================

@api_router.post("/properties")
async def create_property(property_data: PropertyCreate, current_user: dict = Depends(get_current_user)):
    property_id = str(uuid.uuid4())
    prop = Property(id=property_id, **property_data.model_dump(), created_by=current_user["user_id"])
    
    prop_dict = prop.model_dump()
    prop_dict["created_at"] = prop_dict["created_at"].isoformat()
    prop_dict["updated_at"] = prop_dict["updated_at"].isoformat()
    
    await db.properties.insert_one(prop_dict)
    return serialize_doc(prop_dict)

@api_router.get("/properties")
async def get_properties(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    properties = await db.properties.find({"is_deleted": False}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    count = await db.properties.count_documents({"is_deleted": False})
    return {"data": properties, "total": count, "skip": skip, "limit": limit}

@api_router.get("/properties/{property_id}")
async def get_property(property_id: str, current_user: dict = Depends(get_current_user)):
    prop = await db.properties.find_one({"id": property_id, "is_deleted": False}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@api_router.put("/properties/{property_id}")
async def update_property(property_id: str, property_data: PropertyCreate, current_user: dict = Depends(get_current_user)):
    update_data = property_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["user_id"]
    
    result = await db.properties.update_one({"id": property_id, "is_deleted": False}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property updated"}

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.properties.update_one(
        {"id": property_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}

# ==================== PROPERTY TAX ROUTES ====================

@api_router.post("/property-taxes")
async def create_property_tax(tax_data: PropertyTaxCreate, current_user: dict = Depends(get_current_user)):
    tax_id = str(uuid.uuid4())
    tax = PropertyTax(id=tax_id, **tax_data.model_dump(), created_by=current_user["user_id"])
    
    tax_dict = tax.model_dump()
    tax_dict["created_at"] = tax_dict["created_at"].isoformat()
    tax_dict["updated_at"] = tax_dict["updated_at"].isoformat()
    tax_dict["issue_date"] = tax_dict["issue_date"].isoformat()
    tax_dict["expiry_date"] = tax_dict["expiry_date"].isoformat()
    if tax_dict.get("payment_date"):
        tax_dict["payment_date"] = tax_dict["payment_date"].isoformat()
    
    await db.property_taxes.insert_one(tax_dict)
    return serialize_doc(tax_dict)

@api_router.get("/property-taxes")
async def get_property_taxes(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    taxes = await db.property_taxes.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    count = await db.property_taxes.count_documents(query)
    return {"data": taxes, "total": count}

@api_router.get("/property-taxes/{tax_id}")
async def get_property_tax(tax_id: str, current_user: dict = Depends(get_current_user)):
    tax = await db.property_taxes.find_one({"id": tax_id, "is_deleted": False}, {"_id": 0})
    if not tax:
        raise HTTPException(status_code=404, detail="Property tax not found")
    return tax

@api_router.put("/property-taxes/{tax_id}")
async def update_property_tax(tax_id: str, tax_data: PropertyTaxCreate, current_user: dict = Depends(get_current_user)):
    update_data = tax_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["user_id"]
    update_data["issue_date"] = update_data["issue_date"].isoformat()
    update_data["expiry_date"] = update_data["expiry_date"].isoformat()
    if update_data.get("payment_date"):
        update_data["payment_date"] = update_data["payment_date"].isoformat()
    
    result = await db.property_taxes.update_one({"id": tax_id, "is_deleted": False}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property tax not found")
    return {"message": "Property tax updated"}

@api_router.delete("/property-taxes/{tax_id}")
async def delete_property_tax(tax_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.property_taxes.update_one(
        {"id": tax_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property tax not found")
    return {"message": "Property tax deleted"}

# ==================== ELECTRICITY BILL ROUTES ====================

@api_router.post("/electricity-bills")
async def create_electricity_bill(bill_data: ElectricityBillCreate, current_user: dict = Depends(get_current_user)):
    bill_id = str(uuid.uuid4())
    bill = ElectricityBill(id=bill_id, **bill_data.model_dump(), created_by=current_user["user_id"])
    
    bill_dict = bill.model_dump()
    bill_dict["created_at"] = bill_dict["created_at"].isoformat()
    bill_dict["updated_at"] = bill_dict["updated_at"].isoformat()
    bill_dict["billing_period_start"] = bill_dict["billing_period_start"].isoformat()
    bill_dict["billing_period_end"] = bill_dict["billing_period_end"].isoformat()
    bill_dict["due_date"] = bill_dict["due_date"].isoformat()
    if bill_dict.get("payment_date"):
        bill_dict["payment_date"] = bill_dict["payment_date"].isoformat()
    
    await db.electricity_bills.insert_one(bill_dict)
    return serialize_doc(bill_dict)

@api_router.get("/electricity-bills")
async def get_electricity_bills(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    bills = await db.electricity_bills.find(query, {"_id": 0}).sort("billing_period_start", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.electricity_bills.count_documents(query)
    return {"data": bills, "total": count}

@api_router.get("/electricity-bills/{bill_id}")
async def get_electricity_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    bill = await db.electricity_bills.find_one({"id": bill_id, "is_deleted": False}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Electricity bill not found")
    return bill

@api_router.delete("/electricity-bills/{bill_id}")
async def delete_electricity_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.electricity_bills.update_one(
        {"id": bill_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Electricity bill not found")
    return {"message": "Electricity bill deleted"}

# ==================== SOLAR METER ROUTES ====================

@api_router.post("/solar-meters")
async def create_solar_meter(meter_data: SolarMeterCreate, current_user: dict = Depends(get_current_user)):
    meter_id = str(uuid.uuid4())
    meter = SolarMeter(id=meter_id, **meter_data.model_dump(), created_by=current_user["user_id"])
    
    # Check reconciliation: Solar Generated - Exported + Imported = Billable Units
    expected_billable = meter.units_generated - meter.exported_to_grid + meter.imported_from_grid
    if abs(expected_billable - meter.billable_units) > 1:  # 1 unit tolerance
        meter.reconciliation_flag = True
    
    meter_dict = meter.model_dump()
    meter_dict["created_at"] = meter_dict["created_at"].isoformat()
    meter_dict["updated_at"] = meter_dict["updated_at"].isoformat()
    meter_dict["billing_period_start"] = meter_dict["billing_period_start"].isoformat()
    meter_dict["billing_period_end"] = meter_dict["billing_period_end"].isoformat()
    
    await db.solar_meters.insert_one(meter_dict)
    return serialize_doc(meter_dict)

@api_router.get("/solar-meters")
async def get_solar_meters(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    meters = await db.solar_meters.find(query, {"_id": 0}).sort("billing_period_start", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.solar_meters.count_documents(query)
    return {"data": meters, "total": count}

@api_router.get("/solar-meters/{meter_id}")
async def get_solar_meter(meter_id: str, current_user: dict = Depends(get_current_user)):
    meter = await db.solar_meters.find_one({"id": meter_id, "is_deleted": False}, {"_id": 0})
    if not meter:
        raise HTTPException(status_code=404, detail="Solar meter record not found")
    return meter

@api_router.delete("/solar-meters/{meter_id}")
async def delete_solar_meter(meter_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.solar_meters.update_one(
        {"id": meter_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Solar meter record not found")
    return {"message": "Solar meter record deleted"}

# ==================== GAS BILL ROUTES ====================

@api_router.post("/gas-bills")
async def create_gas_bill(bill_data: GasBillCreate, current_user: dict = Depends(get_current_user)):
    bill_id = str(uuid.uuid4())
    bill = GasBill(id=bill_id, **bill_data.model_dump(), created_by=current_user["user_id"])
    
    bill_dict = bill.model_dump()
    bill_dict["created_at"] = bill_dict["created_at"].isoformat()
    bill_dict["updated_at"] = bill_dict["updated_at"].isoformat()
    bill_dict["billing_period_start"] = bill_dict["billing_period_start"].isoformat()
    bill_dict["billing_period_end"] = bill_dict["billing_period_end"].isoformat()
    bill_dict["due_date"] = bill_dict["due_date"].isoformat()
    if bill_dict.get("payment_date"):
        bill_dict["payment_date"] = bill_dict["payment_date"].isoformat()
    
    await db.gas_bills.insert_one(bill_dict)
    return serialize_doc(bill_dict)

@api_router.get("/gas-bills")
async def get_gas_bills(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    bills = await db.gas_bills.find(query, {"_id": 0}).sort("billing_period_start", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.gas_bills.count_documents(query)
    return {"data": bills, "total": count}

@api_router.get("/gas-bills/{bill_id}")
async def get_gas_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    bill = await db.gas_bills.find_one({"id": bill_id, "is_deleted": False}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Gas bill not found")
    return bill

@api_router.delete("/gas-bills/{bill_id}")
async def delete_gas_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.gas_bills.update_one(
        {"id": bill_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gas bill not found")
    return {"message": "Gas bill deleted"}

# ==================== WATER BILL ROUTES ====================

@api_router.post("/water-bills")
async def create_water_bill(bill_data: WaterBillCreate, current_user: dict = Depends(get_current_user)):
    bill_id = str(uuid.uuid4())
    bill = WaterBill(id=bill_id, **bill_data.model_dump(), created_by=current_user["user_id"])
    
    bill_dict = bill.model_dump()
    bill_dict["created_at"] = bill_dict["created_at"].isoformat()
    bill_dict["updated_at"] = bill_dict["updated_at"].isoformat()
    bill_dict["billing_period_start"] = bill_dict["billing_period_start"].isoformat()
    bill_dict["billing_period_end"] = bill_dict["billing_period_end"].isoformat()
    bill_dict["due_date"] = bill_dict["due_date"].isoformat()
    if bill_dict.get("payment_date"):
        bill_dict["payment_date"] = bill_dict["payment_date"].isoformat()
    
    await db.water_bills.insert_one(bill_dict)
    return serialize_doc(bill_dict)

@api_router.get("/water-bills")
async def get_water_bills(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    bills = await db.water_bills.find(query, {"_id": 0}).sort("billing_period_start", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.water_bills.count_documents(query)
    return {"data": bills, "total": count}

@api_router.get("/water-bills/{bill_id}")
async def get_water_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    bill = await db.water_bills.find_one({"id": bill_id, "is_deleted": False}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Water bill not found")
    return bill

@api_router.delete("/water-bills/{bill_id}")
async def delete_water_bill(bill_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.water_bills.update_one(
        {"id": bill_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Water bill not found")
    return {"message": "Water bill deleted"}

# ==================== VEHICLE ROUTES ====================

@api_router.post("/vehicles")
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    vehicle_id = str(uuid.uuid4())
    vehicle = Vehicle(id=vehicle_id, **vehicle_data.model_dump(), created_by=current_user["user_id"])
    
    vehicle_dict = vehicle.model_dump()
    vehicle_dict["created_at"] = vehicle_dict["created_at"].isoformat()
    vehicle_dict["updated_at"] = vehicle_dict["updated_at"].isoformat()
    
    await db.vehicles.insert_one(vehicle_dict)
    return serialize_doc(vehicle_dict)

@api_router.get("/vehicles")
async def get_vehicles(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    vehicles = await db.vehicles.find({"is_deleted": False}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    count = await db.vehicles.count_documents({"is_deleted": False})
    return {"data": vehicles, "total": count}

@api_router.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "is_deleted": False}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@api_router.put("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    update_data = vehicle_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["user_id"]
    
    result = await db.vehicles.update_one({"id": vehicle_id, "is_deleted": False}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle updated"}

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}

# ==================== VEHICLE DOCUMENT ROUTES (VERSIONED) ====================

@api_router.post("/vehicle-documents")
async def create_vehicle_document(doc_data: VehicleDocumentCreate, current_user: dict = Depends(get_current_user)):
    # Check if there's an existing current document of the same type for this vehicle
    existing = await db.vehicle_documents.find_one({
        "vehicle_id": doc_data.vehicle_id,
        "document_type": doc_data.document_type,
        "is_current": True,
        "is_deleted": False
    })
    
    doc_id = str(uuid.uuid4())
    doc = VehicleDocument(id=doc_id, **doc_data.model_dump(), created_by=current_user["user_id"])
    
    if existing:
        # Mark old document as not current and link it
        await db.vehicle_documents.update_one(
            {"id": existing["id"]},
            {"$set": {"is_current": False, "status": "Renewed"}}
        )
        doc.previous_version_id = existing["id"]
        doc.version = existing.get("version", 1) + 1
    
    doc_dict = doc.model_dump()
    doc_dict["created_at"] = doc_dict["created_at"].isoformat()
    doc_dict["updated_at"] = doc_dict["updated_at"].isoformat()
    doc_dict["issue_date"] = doc_dict["issue_date"].isoformat()
    doc_dict["expiry_date"] = doc_dict["expiry_date"].isoformat()
    
    await db.vehicle_documents.insert_one(doc_dict)
    return serialize_doc(doc_dict)

@api_router.get("/vehicle-documents")
async def get_vehicle_documents(
    vehicle_id: Optional[str] = None,
    current_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    if current_only:
        query["is_current"] = True
    
    docs = await db.vehicle_documents.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.vehicle_documents.count_documents(query)
    return {"data": docs, "total": count}

@api_router.get("/vehicle-documents/{document_id}/history")
async def get_document_history(document_id: str, current_user: dict = Depends(get_current_user)):
    # Get current document
    doc = await db.vehicle_documents.find_one({"id": document_id, "is_deleted": False}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Build version history
    history = [doc]
    current_doc = doc
    
    # Traverse backwards through versions
    while current_doc.get("previous_version_id"):
        prev_doc = await db.vehicle_documents.find_one({"id": current_doc["previous_version_id"]}, {"_id": 0})
        if prev_doc:
            history.append(prev_doc)
            current_doc = prev_doc
        else:
            break
    
    return {"vehicle_id": doc["vehicle_id"], "document_type": doc["document_type"], "history": history}

# ==================== CHALLAN ROUTES ====================

@api_router.post("/challans")
async def create_challan(challan_data: ChallanCreate, current_user: dict = Depends(get_current_user)):
    challan_id = str(uuid.uuid4())
    challan = Challan(id=challan_id, **challan_data.model_dump(), created_by=current_user["user_id"])
    
    challan_dict = challan.model_dump()
    challan_dict["created_at"] = challan_dict["created_at"].isoformat()
    challan_dict["updated_at"] = challan_dict["updated_at"].isoformat()
    challan_dict["date"] = challan_dict["date"].isoformat()
    if challan_dict.get("payment_date"):
        challan_dict["payment_date"] = challan_dict["payment_date"].isoformat()
    
    await db.challans.insert_one(challan_dict)
    
    # Update driver risk score if driver is linked
    if challan_data.driver_id:
        await update_driver_risk_score(challan_data.driver_id)
    
    return challan_dict

@api_router.get("/challans")
async def get_challans(
    vehicle_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    if status:
        query["status"] = status
    
    challans = await db.challans.find(query, {"_id": 0}).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.challans.count_documents(query)
    
    # Calculate summary
    unpaid_count = await db.challans.count_documents({**query, "status": "Unpaid"})
    unpaid_pipeline = [
        {"$match": {**query, "status": "Unpaid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    unpaid_result = await db.challans.aggregate(unpaid_pipeline).to_list(1)
    unpaid_amount = unpaid_result[0]["total"] if unpaid_result else 0
    
    return {
        "data": challans,
        "total": count,
        "summary": {
            "unpaid_count": unpaid_count,
            "unpaid_amount": unpaid_amount
        }
    }

# ==================== SERVICE RECORD ROUTES ====================

@api_router.post("/service-records")
async def create_service_record(service_data: ServiceRecordCreate, current_user: dict = Depends(get_current_user)):
    service_id = str(uuid.uuid4())
    service = ServiceRecord(id=service_id, **service_data.model_dump(), created_by=current_user["user_id"])
    
    service_dict = service.model_dump()
    service_dict["created_at"] = service_dict["created_at"].isoformat()
    service_dict["updated_at"] = service_dict["updated_at"].isoformat()
    service_dict["service_date"] = service_dict["service_date"].isoformat()
    if service_dict.get("next_service_due_date"):
        service_dict["next_service_due_date"] = service_dict["next_service_due_date"].isoformat()
    
    await db.service_records.insert_one(service_dict)
    return serialize_doc(service_dict)

@api_router.get("/service-records")
async def get_service_records(
    vehicle_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    
    records = await db.service_records.find(query, {"_id": 0}).sort("service_date", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.service_records.count_documents(query)
    return {"data": records, "total": count}

# ==================== GPS & TELEMATICS ROUTES ====================

@api_router.post("/gps-devices")
async def create_gps_device(device_data: GPSDeviceCreate, current_user: dict = Depends(get_current_user)):
    device_id = str(uuid.uuid4())
    device = GPSDevice(id=device_id, **device_data.model_dump(), created_by=current_user["user_id"])
    
    device_dict = device.model_dump()
    device_dict["created_at"] = device_dict["created_at"].isoformat()
    device_dict["updated_at"] = device_dict["updated_at"].isoformat()
    
    await db.gps_devices.insert_one(device_dict)
    return serialize_doc(device_dict)

@api_router.get("/gps-devices")
async def get_gps_devices(current_user: dict = Depends(get_current_user)):
    devices = await db.gps_devices.find({"is_deleted": False}, {"_id": 0}).to_list(1000)
    return {"data": devices}

@api_router.post("/gps-devices/{device_id}/simulate")
async def simulate_gps_data(
    device_id: str,
    start_time: datetime,
    end_time: datetime,
    current_user: dict = Depends(get_current_user)
):
    """Generate and store simulated GPS data for a device"""
    device = await db.gps_devices.find_one({"id": device_id, "is_deleted": False})
    if not device:
        raise HTTPException(status_code=404, detail="GPS device not found")
    
    # Generate location data
    locations = await telematics_service.get_location_history(device_id, start_time, end_time)
    
    # Store in database
    for loc in locations:
        loc_id = str(uuid.uuid4())
        log = GPSLocationLog(
            id=loc_id,
            gps_device_id=device_id,
            vehicle_id=device["vehicle_id"],
            **loc
        )
        log_dict = log.model_dump()
        log_dict["timestamp"] = log_dict["timestamp"].isoformat()
        await db.gps_location_logs.insert_one(log_dict)
    
    return {"message": f"Generated {len(locations)} location points", "count": len(locations)}

@api_router.get("/gps-location-logs")
async def get_gps_location_logs(
    vehicle_id: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 500,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    if start_time:
        query["timestamp"] = {"$gte": start_time.isoformat()}
    if end_time:
        if "timestamp" not in query:
            query["timestamp"] = {}
        query["timestamp"]["$lte"] = end_time.isoformat()
    
    logs = await db.gps_location_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.gps_location_logs.count_documents(query)
    return {"data": logs, "total": count}

@api_router.post("/trips/calculate")
async def calculate_trip(
    vehicle_id: str,
    start_time: datetime,
    end_time: datetime,
    fuel_price_per_liter: float = 100.0,
    current_user: dict = Depends(get_current_user)
):
    """Calculate trip metrics from GPS logs"""
    # Get vehicle
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "is_deleted": False})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get GPS device
    device = await db.gps_devices.find_one({"vehicle_id": vehicle_id, "is_deleted": False})
    if not device:
        raise HTTPException(status_code=404, detail="GPS device not found for vehicle")
    
    # Get location logs
    logs = await db.gps_location_logs.find({
        "vehicle_id": vehicle_id,
        "timestamp": {"$gte": start_time.isoformat(), "$lte": end_time.isoformat()}
    }, {"_id": 0}).sort("timestamp", 1).to_list(10000)
    
    if not logs:
        raise HTTPException(status_code=404, detail="No GPS data found for this time range")
    
    # Parse timestamps
    for log in logs:
        if isinstance(log["timestamp"], str):
            log["timestamp"] = datetime.fromisoformat(log["timestamp"])
    
    # Calculate trip metrics
    metrics = telematics_service.calculate_trip_metrics(logs)
    
    # Calculate fuel consumption
    fuel_data = telematics_service.calculate_fuel_consumption(
        metrics["distance_km"],
        vehicle["average_kmpl"],
        fuel_price_per_liter
    )
    
    # Create trip record
    trip_id = str(uuid.uuid4())
    trip = Trip(
        id=trip_id,
        vehicle_id=vehicle_id,
        gps_device_id=device["id"],
        start_time=logs[0]["timestamp"],
        end_time=logs[-1]["timestamp"],
        start_location={"lat": logs[0]["latitude"], "lng": logs[0]["longitude"]},
        end_location={"lat": logs[-1]["latitude"], "lng": logs[-1]["longitude"]},
        distance_km=metrics["distance_km"],
        idle_time_minutes=metrics["idle_time_minutes"],
        average_speed=metrics["average_speed"],
        max_speed=metrics["max_speed"],
        fuel_consumed_liters=fuel_data["fuel_consumed_liters"],
        fuel_cost=fuel_data["fuel_cost"],
        created_by=current_user["user_id"]
    )
    
    trip_dict = trip.model_dump()
    trip_dict["created_at"] = trip_dict["created_at"].isoformat()
    trip_dict["updated_at"] = trip_dict["updated_at"].isoformat()
    trip_dict["start_time"] = trip_dict["start_time"].isoformat()
    trip_dict["end_time"] = trip_dict["end_time"].isoformat()
    
    await db.trips.insert_one(trip_dict)
    return serialize_doc(trip_dict)

@api_router.get("/trips")
async def get_trips(
    vehicle_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    
    trips = await db.trips.find(query, {"_id": 0}).sort("start_time", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.trips.count_documents(query)
    return {"data": trips, "total": count}

# ==================== DRIVER ROUTES ====================

@api_router.post("/drivers")
async def create_driver(driver_data: DriverCreate, current_user: dict = Depends(get_current_user)):
    driver_id = str(uuid.uuid4())
    driver = Driver(id=driver_id, **driver_data.model_dump(), created_by=current_user["user_id"])
    
    driver_dict = driver.model_dump()
    driver_dict["created_at"] = driver_dict["created_at"].isoformat()
    driver_dict["updated_at"] = driver_dict["updated_at"].isoformat()
    driver_dict["license_expiry"] = driver_dict["license_expiry"].isoformat()
    
    await db.drivers.insert_one(driver_dict)
    return serialize_doc(driver_dict)

@api_router.get("/drivers")
async def get_drivers(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    drivers = await db.drivers.find({"is_deleted": False}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    count = await db.drivers.count_documents({"is_deleted": False})
    return {"data": drivers, "total": count}

@api_router.put("/drivers/{driver_id}")
async def update_driver(driver_id: str, driver_data: DriverCreate, current_user: dict = Depends(get_current_user)):
    update_data = driver_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["license_expiry"] = update_data["license_expiry"].isoformat()
    
    result = await db.drivers.update_one({"id": driver_id, "is_deleted": False}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver updated"}

async def update_driver_risk_score(driver_id: str):
    """Calculate and update driver risk score based on violations and accidents"""
    challan_count = await db.challans.count_documents({"driver_id": driver_id, "is_deleted": False})
    accident_count = await db.accidents.count_documents({"driver_id": driver_id, "is_deleted": False})
    
    # Simple risk score: 10 points per challan + 50 points per accident
    risk_score = (challan_count * 10) + (accident_count * 50)
    
    await db.drivers.update_one({"id": driver_id}, {"$set": {"risk_score": risk_score}})

# ==================== ACCIDENT & CLAIM ROUTES ====================

@api_router.post("/accidents")
async def create_accident(accident_data: AccidentCreate, current_user: dict = Depends(get_current_user)):
    accident_id = str(uuid.uuid4())
    accident = Accident(id=accident_id, **accident_data.model_dump(), created_by=current_user["user_id"])
    
    accident_dict = accident.model_dump()
    accident_dict["created_at"] = accident_dict["created_at"].isoformat()
    accident_dict["updated_at"] = accident_dict["updated_at"].isoformat()
    accident_dict["accident_date"] = accident_dict["accident_date"].isoformat()
    
    await db.accidents.insert_one(accident_dict)
    
    # Update driver risk score if driver is linked
    if accident_data.driver_id:
        await update_driver_risk_score(accident_data.driver_id)
    
    return accident_dict

@api_router.get("/accidents")
async def get_accidents(
    vehicle_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    if driver_id:
        query["driver_id"] = driver_id
    
    accidents = await db.accidents.find(query, {"_id": 0}).sort("accident_date", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.accidents.count_documents(query)
    return {"data": accidents, "total": count}

@api_router.put("/accidents/{accident_id}")
async def update_accident(accident_id: str, accident_data: AccidentCreate, current_user: dict = Depends(get_current_user)):
    update_data = accident_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["accident_date"] = update_data["accident_date"].isoformat()
    
    result = await db.accidents.update_one({"id": accident_id, "is_deleted": False}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Accident not found")
    return {"message": "Accident updated"}

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    count = await db.notifications.count_documents(query)
    unread_count = await db.notifications.count_documents({"is_read": False, "is_deleted": False})
    
    return {"data": notifications, "total": count, "unread_count": unread_count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# ==================== ANALYTICS & DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get enterprise dashboard statistics"""
    now = datetime.now(timezone.utc)
    
    # Property stats
    total_properties = await db.properties.count_documents({"is_deleted": False})
    
    # Vehicle stats
    total_vehicles = await db.vehicles.count_documents({"is_deleted": False})
    
    # Unpaid bills
    unpaid_electricity = await db.electricity_bills.count_documents({"status": "Unpaid", "is_deleted": False})
    unpaid_gas = await db.gas_bills.count_documents({"status": "Unpaid", "is_deleted": False})
    unpaid_water = await db.water_bills.count_documents({"status": "Unpaid", "is_deleted": False})
    total_unpaid_bills = unpaid_electricity + unpaid_gas + unpaid_water
    
    # Expired taxes
    expired_taxes = await db.property_taxes.count_documents({
        "expiry_date": {"$lt": now.isoformat()},
        "status": "Unpaid",
        "is_deleted": False
    })
    
    # Expiring documents (next 30 days)
    expiring_threshold = now + timedelta(days=30)
    expiring_docs = await db.vehicle_documents.count_documents({
        "expiry_date": {"$lte": expiring_threshold.isoformat(), "$gte": now.isoformat()},
        "is_current": True,
        "is_deleted": False
    })
    
    # Unpaid challans
    unpaid_challans_pipeline = [
        {"$match": {"status": "Unpaid", "is_deleted": False}},
        {"$group": {"_id": None, "count": {"$sum": 1}, "total": {"$sum": "$amount"}}}
    ]
    unpaid_challans_result = await db.challans.aggregate(unpaid_challans_pipeline).to_list(1)
    unpaid_challans_count = unpaid_challans_result[0]["count"] if unpaid_challans_result else 0
    unpaid_challans_amount = unpaid_challans_result[0]["total"] if unpaid_challans_result else 0
    
    # Total energy consumption (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    energy_pipeline = [
        {"$match": {
            "billing_period_start": {"$gte": thirty_days_ago.isoformat()},
            "is_deleted": False
        }},
        {"$group": {"_id": None, "total_units": {"$sum": "$units_consumed"}}}
    ]
    energy_result = await db.electricity_bills.aggregate(energy_pipeline).to_list(1)
    total_energy_units = energy_result[0]["total_units"] if energy_result else 0
    
    # Solar generation (last 30 days)
    solar_pipeline = [
        {"$match": {
            "billing_period_start": {"$gte": thirty_days_ago.isoformat()},
            "is_deleted": False
        }},
        {"$group": {"_id": None, "total_generated": {"$sum": "$units_generated"}}}
    ]
    solar_result = await db.solar_meters.aggregate(solar_pipeline).to_list(1)
    total_solar_generated = solar_result[0]["total_generated"] if solar_result else 0
    
    # Total fuel cost (last 30 days)
    fuel_pipeline = [
        {"$match": {
            "start_time": {"$gte": thirty_days_ago.isoformat()},
            "is_deleted": False
        }},
        {"$group": {"_id": None, "total_cost": {"$sum": "$fuel_cost"}, "total_distance": {"$sum": "$distance_km"}}}
    ]
    fuel_result = await db.trips.aggregate(fuel_pipeline).to_list(1)
    total_fuel_cost = fuel_result[0]["total_cost"] if fuel_result else 0
    total_distance = fuel_result[0]["total_distance"] if fuel_result else 0
    
    # Unread notifications
    unread_notifications = await db.notifications.count_documents({"is_read": False, "is_deleted": False})
    
    # Critical alerts
    critical_alerts = await db.notifications.count_documents({
        "severity": "critical",
        "is_read": False,
        "is_deleted": False
    })
    
    # Sustainability metrics
    renewable_percentage = (total_solar_generated / total_energy_units * 100) if total_energy_units > 0 else 0
    co2_saved = total_solar_generated * 0.92  # Approx 0.92 kg CO2 per kWh
    
    return {
        "properties": {
            "total": total_properties
        },
        "vehicles": {
            "total": total_vehicles
        },
        "bills": {
            "unpaid_count": total_unpaid_bills
        },
        "taxes": {
            "expired_count": expired_taxes
        },
        "documents": {
            "expiring_count": expiring_docs
        },
        "challans": {
            "unpaid_count": unpaid_challans_count,
            "unpaid_amount": round(unpaid_challans_amount, 2)
        },
        "energy": {
            "total_consumption_kwh": round(total_energy_units, 2),
            "solar_generation_kwh": round(total_solar_generated, 2),
            "renewable_percentage": round(renewable_percentage, 2)
        },
        "fleet": {
            "total_fuel_cost": round(total_fuel_cost, 2),
            "total_distance_km": round(total_distance, 2),
            "cost_per_km": round(total_fuel_cost / total_distance, 2) if total_distance > 0 else 0
        },
        "notifications": {
            "unread_count": unread_notifications,
            "critical_count": critical_alerts
        },
        "sustainability": {
            "co2_saved_kg": round(co2_saved, 2),
            "renewable_percentage": round(renewable_percentage, 2)
        }
    }

@api_router.get("/analytics/energy-trends")
async def get_energy_trends(
    property_id: Optional[str] = None,
    months: int = 12,
    current_user: dict = Depends(get_current_user)
):
    """Get monthly energy consumption trends"""
    query = {"is_deleted": False}
    if property_id:
        query["property_id"] = property_id
    
    # Get last N months of data
    bills = await db.electricity_bills.find(query, {"_id": 0}).sort("billing_period_start", -1).limit(months).to_list(months)
    
    trends = []
    for bill in reversed(bills):
        if isinstance(bill["billing_period_start"], str):
            period_start = datetime.fromisoformat(bill["billing_period_start"])
        else:
            period_start = bill["billing_period_start"]
        
        trends.append({
            "month": period_start.strftime("%b %Y"),
            "units_consumed": bill["units_consumed"],
            "total_amount": bill["total_amount"]
        })
    
    return {"data": trends}

@api_router.get("/analytics/fuel-efficiency")
async def get_fuel_efficiency(
    vehicle_id: Optional[str] = None,
    months: int = 6,
    current_user: dict = Depends(get_current_user)
):
    """Get fuel efficiency analytics"""
    query = {"is_deleted": False}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    
    # Get trips from last N months
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=months * 30)
    query["start_time"] = {"$gte": cutoff_date.isoformat()}
    
    trips = await db.trips.find(query, {"_id": 0}).sort("start_time", -1).to_list(1000)
    
    # Group by vehicle and month
    vehicle_stats = {}
    for trip in trips:
        vid = trip["vehicle_id"]
        if vid not in vehicle_stats:
            vehicle_stats[vid] = {
                "vehicle_id": vid,
                "total_distance": 0,
                "total_fuel_consumed": 0,
                "total_fuel_cost": 0,
                "trip_count": 0
            }
        
        vehicle_stats[vid]["total_distance"] += trip["distance_km"]
        vehicle_stats[vid]["total_fuel_consumed"] += trip["fuel_consumed_liters"]
        vehicle_stats[vid]["total_fuel_cost"] += trip["fuel_cost"]
        vehicle_stats[vid]["trip_count"] += 1
    
    # Calculate efficiency
    for vid, stats in vehicle_stats.items():
        if stats["total_fuel_consumed"] > 0:
            stats["average_kmpl"] = round(stats["total_distance"] / stats["total_fuel_consumed"], 2)
        else:
            stats["average_kmpl"] = 0
        
        if stats["total_distance"] > 0:
            stats["cost_per_km"] = round(stats["total_fuel_cost"] / stats["total_distance"], 2)
        else:
            stats["cost_per_km"] = 0
    
    return {"data": list(vehicle_stats.values())}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Enterprise ERP Backend Started")
