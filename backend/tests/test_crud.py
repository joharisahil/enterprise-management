import pytest
import uuid
from datetime import datetime, timedelta

class TestProperties:
    """Test Property CRUD operations"""

    def test_create_property(self, authenticated_client, base_url):
        """Test creating a property"""
        test_name = f"TEST_Property_{uuid.uuid4().hex[:8]}"
        response = authenticated_client.post(f"{base_url}/api/properties", json={
            "name": test_name,
            "type": "Commercial",
            "address": "123 Test Street, Mumbai",
            "area_sqft": 5000.0
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_name
        assert data["type"] == "Commercial"
        assert data["address"] == "123 Test Street, Mumbai"
        assert data["area_sqft"] == 5000.0
        assert "id" in data
        
        # Verify via GET
        get_response = authenticated_client.get(f"{base_url}/api/properties/{data['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == test_name
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/properties/{data['id']}")

    def test_get_properties(self, authenticated_client, base_url):
        """Test listing properties"""
        response = authenticated_client.get(f"{base_url}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)

    def test_update_property(self, authenticated_client, base_url):
        """Test updating a property"""
        # Create first
        test_name = f"TEST_Property_{uuid.uuid4().hex[:8]}"
        create_response = authenticated_client.post(f"{base_url}/api/properties", json={
            "name": test_name,
            "type": "Commercial",
            "address": "123 Test Street",
            "area_sqft": 5000.0
        })
        property_id = create_response.json()["id"]
        
        # Update
        updated_name = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        update_response = authenticated_client.put(f"{base_url}/api/properties/{property_id}", json={
            "name": updated_name,
            "type": "Residential",
            "address": "456 Updated Street",
            "area_sqft": 7500.0
        })
        assert update_response.status_code == 200
        
        # Verify via GET
        get_response = authenticated_client.get(f"{base_url}/api/properties/{property_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["name"] == updated_name
        assert data["type"] == "Residential"
        assert data["area_sqft"] == 7500.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/properties/{property_id}")

    def test_delete_property(self, authenticated_client, base_url):
        """Test deleting a property"""
        # Create first
        test_name = f"TEST_ToDelete_{uuid.uuid4().hex[:8]}"
        create_response = authenticated_client.post(f"{base_url}/api/properties", json={
            "name": test_name,
            "type": "Industrial",
            "address": "789 Delete Street",
            "area_sqft": 10000.0
        })
        property_id = create_response.json()["id"]
        
        # Delete
        delete_response = authenticated_client.delete(f"{base_url}/api/properties/{property_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted (should return 404)
        get_response = authenticated_client.get(f"{base_url}/api/properties/{property_id}")
        assert get_response.status_code == 404


class TestPropertyTaxes:
    """Test Property Tax CRUD operations"""

    @pytest.fixture
    def test_property(self, authenticated_client, base_url):
        """Create a test property for tax tests"""
        test_name = f"TEST_TaxProperty_{uuid.uuid4().hex[:8]}"
        response = authenticated_client.post(f"{base_url}/api/properties", json={
            "name": test_name,
            "type": "Commercial",
            "address": "Tax Test Address",
            "area_sqft": 3000.0
        })
        property_data = response.json()
        yield property_data
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/properties/{property_data['id']}")

    def test_create_property_tax(self, authenticated_client, base_url, test_property):
        """Test creating a property tax record"""
        issue_date = datetime.now().isoformat()
        expiry_date = (datetime.now() + timedelta(days=365)).isoformat()
        
        response = authenticated_client.post(f"{base_url}/api/property-taxes", json={
            "property_id": test_property["id"],
            "tax_type": "House Tax",
            "amount": 15000.0,
            "issue_date": issue_date,
            "expiry_date": expiry_date,
            "status": "Unpaid",
            "frequency": "Yearly"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == test_property["id"]
        assert data["tax_type"] == "House Tax"
        assert data["amount"] == 15000.0
        assert data["status"] == "Unpaid"
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/property-taxes/{data['id']}")

    def test_get_property_taxes(self, authenticated_client, base_url):
        """Test listing property taxes"""
        response = authenticated_client.get(f"{base_url}/api/property-taxes")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data


class TestVehicles:
    """Test Vehicle CRUD operations"""

    def test_create_vehicle(self, authenticated_client, base_url):
        """Test creating a vehicle"""
        reg_number = f"TEST-MH-{uuid.uuid4().hex[:4].upper()}"
        response = authenticated_client.post(f"{base_url}/api/vehicles", json={
            "registration_number": reg_number,
            "type": "Car",
            "brand": "Tata",
            "model": "Nexon",
            "fuel_type": "Diesel",
            "average_kmpl": 18.5,
            "tank_capacity_liters": 45.0,
            "year": 2023
        })
        assert response.status_code == 200
        data = response.json()
        assert data["registration_number"] == reg_number
        assert data["type"] == "Car"
        assert data["brand"] == "Tata"
        assert data["model"] == "Nexon"
        assert data["fuel_type"] == "Diesel"
        assert data["average_kmpl"] == 18.5
        
        # Verify via GET
        get_response = authenticated_client.get(f"{base_url}/api/vehicles/{data['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["registration_number"] == reg_number
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/vehicles/{data['id']}")

    def test_get_vehicles(self, authenticated_client, base_url):
        """Test listing vehicles"""
        response = authenticated_client.get(f"{base_url}/api/vehicles")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)

    def test_update_vehicle(self, authenticated_client, base_url):
        """Test updating a vehicle"""
        reg_number = f"TEST-MH-{uuid.uuid4().hex[:4].upper()}"
        create_response = authenticated_client.post(f"{base_url}/api/vehicles", json={
            "registration_number": reg_number,
            "type": "Car",
            "brand": "Tata",
            "model": "Nexon",
            "fuel_type": "Diesel",
            "average_kmpl": 18.5,
            "tank_capacity_liters": 45.0
        })
        vehicle_id = create_response.json()["id"]
        
        # Update
        update_response = authenticated_client.put(f"{base_url}/api/vehicles/{vehicle_id}", json={
            "registration_number": reg_number,
            "type": "Truck",
            "brand": "Mahindra",
            "model": "Bolero",
            "fuel_type": "Diesel",
            "average_kmpl": 12.0,
            "tank_capacity_liters": 60.0
        })
        assert update_response.status_code == 200
        
        # Verify via GET
        get_response = authenticated_client.get(f"{base_url}/api/vehicles/{vehicle_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["type"] == "Truck"
        assert data["brand"] == "Mahindra"
        assert data["average_kmpl"] == 12.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/vehicles/{vehicle_id}")

    def test_delete_vehicle(self, authenticated_client, base_url):
        """Test deleting a vehicle"""
        reg_number = f"TEST-MH-{uuid.uuid4().hex[:4].upper()}"
        create_response = authenticated_client.post(f"{base_url}/api/vehicles", json={
            "registration_number": reg_number,
            "type": "Van",
            "brand": "Maruti",
            "model": "Eeco",
            "fuel_type": "Petrol",
            "average_kmpl": 14.0,
            "tank_capacity_liters": 40.0
        })
        vehicle_id = create_response.json()["id"]
        
        # Delete
        delete_response = authenticated_client.delete(f"{base_url}/api/vehicles/{vehicle_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = authenticated_client.get(f"{base_url}/api/vehicles/{vehicle_id}")
        assert get_response.status_code == 404


class TestUtilityBills:
    """Test Utility Bills CRUD operations"""

    @pytest.fixture
    def test_property(self, authenticated_client, base_url):
        """Create a test property for utility tests"""
        test_name = f"TEST_UtilProperty_{uuid.uuid4().hex[:8]}"
        response = authenticated_client.post(f"{base_url}/api/properties", json={
            "name": test_name,
            "type": "Commercial",
            "address": "Utility Test Address",
            "area_sqft": 2000.0
        })
        property_data = response.json()
        yield property_data
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/properties/{property_data['id']}")

    def test_create_electricity_bill(self, authenticated_client, base_url, test_property):
        """Test creating an electricity bill"""
        response = authenticated_client.post(f"{base_url}/api/electricity-bills", json={
            "property_id": test_property["id"],
            "billing_period_start": "2024-01-01T00:00:00Z",
            "billing_period_end": "2024-01-31T23:59:59Z",
            "previous_reading": 1000.0,
            "current_reading": 1500.0,
            "units_consumed": 500.0,
            "slab_charges": 2500.0,
            "fixed_charges": 200.0,
            "taxes": 300.0,
            "penalty": 0.0,
            "total_amount": 3000.0,
            "due_date": "2024-02-15T00:00:00Z",
            "status": "Unpaid"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == test_property["id"]
        assert data["units_consumed"] == 500.0
        assert data["total_amount"] == 3000.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/electricity-bills/{data['id']}")

    def test_get_electricity_bills(self, authenticated_client, base_url):
        """Test listing electricity bills"""
        response = authenticated_client.get(f"{base_url}/api/electricity-bills")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data

    def test_create_gas_bill(self, authenticated_client, base_url, test_property):
        """Test creating a gas bill"""
        response = authenticated_client.post(f"{base_url}/api/gas-bills", json={
            "property_id": test_property["id"],
            "billing_period_start": "2024-01-01T00:00:00Z",
            "billing_period_end": "2024-01-31T23:59:59Z",
            "units_consumed": 50.0,
            "rate_per_unit": 25.0,
            "fixed_charges": 100.0,
            "total_bill": 1350.0,
            "due_date": "2024-02-15T00:00:00Z",
            "status": "Unpaid",
            "vendor": "IGL"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == test_property["id"]
        assert data["vendor"] == "IGL"
        assert data["total_bill"] == 1350.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/gas-bills/{data['id']}")

    def test_get_gas_bills(self, authenticated_client, base_url):
        """Test listing gas bills"""
        response = authenticated_client.get(f"{base_url}/api/gas-bills")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data

    def test_create_water_bill(self, authenticated_client, base_url, test_property):
        """Test creating a water bill"""
        response = authenticated_client.post(f"{base_url}/api/water-bills", json={
            "property_id": test_property["id"],
            "billing_period_start": "2024-01-01T00:00:00Z",
            "billing_period_end": "2024-01-31T23:59:59Z",
            "units_consumed": 100.0,
            "sewage_charges": 200.0,
            "tanker_usage": 0.0,
            "total_bill": 800.0,
            "due_date": "2024-02-15T00:00:00Z",
            "status": "Unpaid"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == test_property["id"]
        assert data["units_consumed"] == 100.0
        assert data["total_bill"] == 800.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/water-bills/{data['id']}")

    def test_get_water_bills(self, authenticated_client, base_url):
        """Test listing water bills"""
        response = authenticated_client.get(f"{base_url}/api/water-bills")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data

    def test_create_solar_meter(self, authenticated_client, base_url, test_property):
        """Test creating a solar meter record"""
        response = authenticated_client.post(f"{base_url}/api/solar-meters", json={
            "property_id": test_property["id"],
            "billing_period_start": "2024-01-01T00:00:00Z",
            "billing_period_end": "2024-01-31T23:59:59Z",
            "installed_capacity_kw": 10.0,
            "units_generated": 400.0,
            "self_consumed": 300.0,
            "exported_to_grid": 100.0,
            "imported_from_grid": 50.0,
            "net_units": 50.0,
            "feed_in_tariff": 3.0,
            "credit_carried_forward": 0.0,
            "billable_units": 50.0
        })
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == test_property["id"]
        assert data["units_generated"] == 400.0
        assert data["installed_capacity_kw"] == 10.0
        
        # Cleanup
        authenticated_client.delete(f"{base_url}/api/solar-meters/{data['id']}")

    def test_get_solar_meters(self, authenticated_client, base_url):
        """Test listing solar meters"""
        response = authenticated_client.get(f"{base_url}/api/solar-meters")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data


class TestDashboard:
    """Test Dashboard/Analytics endpoints"""

    def test_get_dashboard_stats(self, authenticated_client, base_url):
        """Test getting dashboard stats"""
        response = authenticated_client.get(f"{base_url}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        assert "vehicles" in data
        assert "bills" in data
        assert "energy" in data
        assert "fleet" in data
