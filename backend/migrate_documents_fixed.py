# quick_check.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

async def check_new_vehicle():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get the most recently added vehicle
    vehicles = await db.vehicles.find({"is_deleted": False}).sort("created_at", -1).limit(1).to_list(1)
    
    if vehicles:
        vehicle = vehicles[0]
        print(f"\n🚗 Most recent vehicle: {vehicle['registration_number']} (ID: {vehicle['id']})")
        
        # Check documents for this vehicle
        docs = await db.vehicle_documents.find({
            "vehicle_id": vehicle["id"],
            "is_deleted": False
        }).to_list(10)
        
        print(f"📄 Found {len(docs)} documents:")
        for doc in docs:
            print(f"  - {doc['document_type']}: {doc['status']} (expires: {doc.get('expiry_date', 'N/A')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_new_vehicle())