from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
from enum import Enum

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    PROPERTY_MANAGER = "PropertyManager"
    FLEET_MANAGER = "FleetManager"
    ACCOUNTANT = "Accountant"
    VIEWER = "Viewer"

class PropertyType(str, Enum):
    COMMERCIAL = "Commercial"
    RESIDENTIAL = "Residential"
    INDUSTRIAL = "Industrial"

class TaxType(str, Enum):
    HOUSE_TAX = "House Tax"
    PROPERTY_TAX = "Property Tax"
    MUNICIPAL_TAX = "Municipal Tax"
    OTHER = "Other"

class TaxFrequency(str, Enum):
    YEARLY = "Yearly"
    HALF_YEARLY = "Half-Yearly"
    ONE_TIME = "One-Time"

class PaymentStatus(str, Enum):
    PAID = "Paid"
    UNPAID = "Unpaid"

class VehicleType(str, Enum):
    CAR = "Car"
    TRUCK = "Truck"
    VAN = "Van"
    BIKE = "Bike"
    BUS = "Bus"

class FuelType(str, Enum):
    PETROL = "Petrol"
    DIESEL = "Diesel"
    ELECTRIC = "Electric"
    CNG = "CNG"
    HYBRID = "Hybrid"

class DocumentType(str, Enum):
    INSURANCE = "Insurance"
    PUC = "PUC"
    FITNESS = "Fitness"
    RC = "RC"
    PERMIT = "Permit"
    CUSTOM = "Custom"

class ServiceType(str, Enum):
    ROUTINE = "Routine"
    REPAIR = "Repair"
    INSPECTION = "Inspection"
    EMERGENCY = "Emergency"

class ClaimStatus(str, Enum):
    FILED = "Filed"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SETTLED = "Settled"

# Base Models
class TimestampModel(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    is_deleted: bool = False

# User Models
class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    hashed_password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

# Property Models
class PropertyBase(BaseModel):
    name: str
    type: PropertyType
    address: str
    geo_location: Optional[dict] = None  # {"lat": float, "lng": float}
    area_sqft: float

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Property Tax Models
class PropertyTaxBase(BaseModel):
    property_id: str
    tax_type: TaxType
    custom_tax_name: Optional[str] = None
    amount: float
    issue_date: datetime
    expiry_date: datetime
    payment_date: Optional[datetime] = None
    status: PaymentStatus
    frequency: TaxFrequency
    receipt_url: Optional[str] = None

    @field_validator('expiry_date')
    @classmethod
    def validate_expiry_date(cls, v, info):
        if 'issue_date' in info.data and 'frequency' in info.data:
            issue_date = info.data['issue_date']
            frequency = info.data['frequency']
            
            from dateutil.relativedelta import relativedelta
            
            if frequency == TaxFrequency.YEARLY:
                expected_expiry = issue_date + relativedelta(years=1)
            elif frequency == TaxFrequency.HALF_YEARLY:
                expected_expiry = issue_date + relativedelta(months=6)
            else:
                return v
            
            # Allow 1 day tolerance
            delta = abs((v - expected_expiry).days)
            if delta > 1:
                raise ValueError(f"Expiry date must be {frequency.value} from issue date")
        return v

    @field_validator('payment_date')
    @classmethod
    def validate_payment_date(cls, v, info):
        if 'status' in info.data:
            if info.data['status'] == PaymentStatus.PAID and not v:
                raise ValueError("Payment date required when status is Paid")
        return v

class PropertyTaxCreate(PropertyTaxBase):
    pass

class PropertyTax(PropertyTaxBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Electricity Bill Models
class ElectricityBillBase(BaseModel):
    property_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    previous_reading: float
    current_reading: float
    units_consumed: float
    slab_charges: float
    fixed_charges: float
    taxes: float
    penalty: float = 0
    total_amount: float
    due_date: datetime
    payment_date: Optional[datetime] = None
    status: PaymentStatus
    bill_url: Optional[str] = None

    @field_validator('current_reading')
    @classmethod
    def validate_reading(cls, v, info):
        if 'previous_reading' in info.data:
            if v < info.data['previous_reading']:
                raise ValueError("Current reading must be greater than previous reading")
        return v

    @field_validator('payment_date')
    @classmethod
    def validate_payment_date(cls, v, info):
        if 'status' in info.data:
            if info.data['status'] == PaymentStatus.PAID and not v:
                raise ValueError("Payment date required when status is Paid")
        return v

class ElectricityBillCreate(ElectricityBillBase):
    pass

class ElectricityBill(ElectricityBillBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Solar Meter Models
class SolarMeterBase(BaseModel):
    property_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    installed_capacity_kw: float
    units_generated: float
    self_consumed: float
    exported_to_grid: float
    imported_from_grid: float
    net_units: float
    feed_in_tariff: float
    credit_carried_forward: float = 0
    billable_units: float
    reconciliation_flag: bool = False

class SolarMeterCreate(SolarMeterBase):
    pass

class SolarMeter(SolarMeterBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Gas Bill Models
class GasBillBase(BaseModel):
    property_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    units_consumed: float
    rate_per_unit: float
    fixed_charges: float
    total_bill: float
    due_date: datetime
    payment_date: Optional[datetime] = None
    status: PaymentStatus
    vendor: str
    bill_url: Optional[str] = None

    @field_validator('payment_date')
    @classmethod
    def validate_payment_date(cls, v, info):
        if 'status' in info.data:
            if info.data['status'] == PaymentStatus.PAID and not v:
                raise ValueError("Payment date required when status is Paid")
        return v

class GasBillCreate(GasBillBase):
    pass

class GasBill(GasBillBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Water Bill Models
class WaterBillBase(BaseModel):
    property_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    units_consumed: float
    sewage_charges: float
    tanker_usage: float = 0
    total_bill: float
    due_date: datetime
    payment_date: Optional[datetime] = None
    status: PaymentStatus
    bill_url: Optional[str] = None

    @field_validator('payment_date')
    @classmethod
    def validate_payment_date(cls, v, info):
        if 'status' in info.data:
            if info.data['status'] == PaymentStatus.PAID and not v:
                raise ValueError("Payment date required when status is Paid")
        return v

class WaterBillCreate(WaterBillBase):
    pass

class WaterBill(WaterBillBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Vehicle Models
class VehicleBase(BaseModel):
    registration_number: str
    type: VehicleType
    brand: str
    model: str
    year: Optional[int] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    color: Optional[str] = None
    fuel_type: FuelType
    average_kmpl: float
    tank_capacity_liters: float
    seating_capacity: Optional[int] = None
    fastag_id: Optional[str] = None
    gps_device_id: Optional[str] = None
    assigned_property_id: Optional[str] = None
    # New fields
    owner_name: Optional[str] = None
    file_status: Optional[bool] = False  # Yes/No
    site_name: Optional[str] = None
    date_of_registration: Optional[datetime] = None
    tax_upto: Optional[str] = None  # Can be text or date
    remark: Optional[str] = None
     # FASTag
    fastag_company: Optional[str] = None
    fastag_balance: Optional[float] = None
    fastag_user_id: Optional[str] = None
    fastag_password: Optional[str] = None
    fastag_sold: Optional[bool] = False
    fastag_sold_date: Optional[datetime] = None

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Vehicle Document Models (Versioned)
class VehicleDocumentBase(BaseModel):
    vehicle_id: str
    document_type: DocumentType
    custom_document_name: Optional[str] = None
    policy_number: str
    provider: str
    phone_number: Optional[str] = None
    issue_date: datetime
    expiry_date: datetime
    premium: Optional[float] = None
    coverage: Optional[str] = None
    status: Literal["Active", "Expired", "Renewed"] = "Active"
    file_url: Optional[str] = None
    version: int = 1
    is_current: bool = True
    previous_version_id: Optional[str] = None

class VehicleDocumentCreate(VehicleDocumentBase):
    pass

class VehicleDocument(VehicleDocumentBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Challan Models
class ChallanBase(BaseModel):
    vehicle_id: str
    driver_id: Optional[str] = None
    challan_number: str
    phone_number: Optional[str] = None
    date: datetime
    violation_type: str
    amount: float
    status: PaymentStatus
    payment_date: Optional[datetime] = None
    location: str
    proof_url: Optional[str] = None

    @field_validator('payment_date')
    @classmethod
    def validate_payment_date(cls, v, info):
        if 'status' in info.data:
            if info.data['status'] == PaymentStatus.PAID and not v:
                raise ValueError("Payment date required when status is Paid")
        return v

class ChallanCreate(ChallanBase):
    pass

class Challan(ChallanBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Service Record Models
class ServiceRecordBase(BaseModel):
    vehicle_id: str
    service_date: datetime
    service_type: ServiceType
    odometer_reading: float
    cost: float
    vendor: str
    next_service_due_km: Optional[float] = None
    next_service_due_date: Optional[datetime] = None
    notes: Optional[str] = None
    invoice_url: Optional[str] = None

class ServiceRecordCreate(ServiceRecordBase):
    pass

class ServiceRecord(ServiceRecordBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# GPS Device Models
class GPSDeviceBase(BaseModel):
    imei: str
    provider: str = "Simulation"  # Default to simulation
    vehicle_id: str
    is_active: bool = True

class GPSDeviceCreate(GPSDeviceBase):
    pass

class GPSDevice(GPSDeviceBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# GPS Location Log Models
class GPSLocationLogBase(BaseModel):
    gps_device_id: str
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float  # km/h
    ignition: bool
    timestamp: datetime

class GPSLocationLogCreate(GPSLocationLogBase):
    pass

class GPSLocationLog(GPSLocationLogBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Trip Models
class TripBase(BaseModel):
    vehicle_id: str
    gps_device_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    start_location: dict  # {"lat": float, "lng": float}
    end_location: Optional[dict] = None
    distance_km: float = 0
    idle_time_minutes: float = 0
    average_speed: float = 0
    max_speed: float = 0
    fuel_consumed_liters: float = 0
    fuel_cost: float = 0

class TripCreate(TripBase):
    pass

class Trip(TripBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Driver Models
class DriverBase(BaseModel):
    full_name: str
    license_number: str
    license_expiry: datetime
    contact: str
    email: Optional[str] = None
    assigned_vehicle_ids: List[str] = []

class DriverCreate(DriverBase):
    pass

class Driver(DriverBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    risk_score: float = 0  # Calculated based on accidents/violations

# Accident Models
class AccidentBase(BaseModel):
    vehicle_id: str
    driver_id: Optional[str] = None
    accident_date: datetime
    location: str
    geo_location: Optional[dict] = None
    fir_number: Optional[str] = None
    damage_description: str
    damage_images: List[str] = []
    repair_cost: float = 0
    claim_amount: float = 0
    settlement_amount: float = 0
    claim_status: ClaimStatus
    insurance_policy_id: Optional[str] = None

class AccidentCreate(AccidentBase):
    pass

class Accident(AccidentBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str

# Audit Log Models
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    action: str
    resource: str
    resource_id: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Notification Models
class NotificationBase(BaseModel):
    type: str  # "expiry_alert", "bill_due", "abnormal_consumption", etc.
    title: str
    message: str
    severity: Literal["info", "warning", "critical"]
    resource_type: str
    resource_id: str
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase, TimestampModel):
    model_config = ConfigDict(extra="ignore")
    id: str
