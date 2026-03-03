# Enterprise ERP System - Product Requirements Document

## Original Problem Statement
Build a production-grade Enterprise Resource Planning (ERP) system to manage properties, utilities, and a vehicle fleet for a single enterprise client, with an architecture ready for multi-tenant expansion.

## Tech Stack
- **Backend:** FastAPI (Python) with Motor (async MongoDB driver)
- **Frontend:** React with Tailwind CSS and shadcn/ui
- **Database:** MongoDB
- **Authentication:** JWT-based authentication

## Core Modules & Features

### 1. Authentication & Users
- [x] JWT Login/Register
- [x] Default admin user (admin@erp.com / password123)
- [ ] Role-based access control (RBAC) - Planned
- [ ] Audit logs - Planned
- [ ] Soft delete - Planned

### 2. Property Management
- [x] Create property (name, type, address, area)
- [x] View property details
- [x] Edit property
- [x] Delete property
- [x] List all properties with filters

### 3. Property Tax Management
- [x] Create tax record
- [x] View tax details
- [x] Edit tax record
- [x] Delete tax record
- [x] Track status (Paid/Unpaid)
- [x] Expiry alerts visual indicators

### 4. Utility Management

#### Electricity (Grid + Solar)
- [x] Create electricity bill
- [x] View bill details
- [x] Delete electricity bill
- [x] Create solar meter record
- [x] View solar meter details
- [x] Delete solar meter record

#### Gas
- [x] Create gas bill
- [x] View bill details
- [x] Delete gas bill

#### Water
- [x] Create water bill
- [x] View bill details
- [x] Delete water bill

### 5. Fleet/Vehicle Management
- [x] Create vehicle (registration, type, brand, model, chassis, engine, fuel specs)
- [x] View vehicle details
- [x] Edit vehicle
- [x] Delete vehicle
- [x] Track mileage and tank capacity

### 6. Fleet Operations (Existing)
- [x] Challans management
- [x] Service/Maintenance logs
- [x] Drivers management
- [x] Accidents/Claims tracking
- [x] Document management

### 7. Enterprise Dashboard
- [x] KPI cards (Properties, Vehicles, Bills, Taxes)
- [x] Energy consumption trends chart
- [x] Sustainability metrics

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Properties
- GET `/api/properties` - List all properties
- GET `/api/properties/{id}` - Get property details
- POST `/api/properties` - Create property
- PUT `/api/properties/{id}` - Update property
- DELETE `/api/properties/{id}` - Delete property

### Property Taxes
- GET `/api/property-taxes` - List all taxes
- GET `/api/property-taxes/{id}` - Get tax details
- POST `/api/property-taxes` - Create tax
- PUT `/api/property-taxes/{id}` - Update tax
- DELETE `/api/property-taxes/{id}` - Delete tax

### Electricity Bills
- GET `/api/electricity-bills` - List all bills
- GET `/api/electricity-bills/{id}` - Get bill details
- POST `/api/electricity-bills` - Create bill
- DELETE `/api/electricity-bills/{id}` - Delete bill

### Solar Meters
- GET `/api/solar-meters` - List all records
- GET `/api/solar-meters/{id}` - Get record details
- POST `/api/solar-meters` - Create record
- DELETE `/api/solar-meters/{id}` - Delete record

### Gas Bills
- GET `/api/gas-bills` - List all bills
- GET `/api/gas-bills/{id}` - Get bill details
- POST `/api/gas-bills` - Create bill
- DELETE `/api/gas-bills/{id}` - Delete bill

### Water Bills
- GET `/api/water-bills` - List all bills
- GET `/api/water-bills/{id}` - Get bill details
- POST `/api/water-bills` - Create bill
- DELETE `/api/water-bills/{id}` - Delete bill

### Vehicles
- GET `/api/vehicles` - List all vehicles
- GET `/api/vehicles/{id}` - Get vehicle details
- POST `/api/vehicles` - Create vehicle
- PUT `/api/vehicles/{id}` - Update vehicle
- DELETE `/api/vehicles/{id}` - Delete vehicle

## Completed Work (December 2025)

### Session 1 - Initial Build
- Full-stack scaffolding with FastAPI + React
- Core modules with basic CRUD
- JWT authentication
- Dashboard with analytics

### Session 2 - CRUD Completion
- Added full CRUD operations for Properties (view, edit, delete)
- Added full CRUD for Property Taxes (view, edit, delete)
- Added view/delete for Electricity Bills
- Added view/delete for Solar Meters
- Added view/delete for Gas Bills
- Added view/delete for Water Bills
- Added full CRUD for Fleet/Vehicles (view, edit, delete)
- All backend endpoints tested and verified

## Upcoming Tasks (Prioritized Backlog)

### P0 - Critical
- Backend refactoring (break down monolithic server.py)

### P1 - High Priority
- Role-Based Access Control (RBAC)
- Edit functionality for utility bills

### P2 - Medium Priority
- Analytics & Dashboard with real-time data
- Automation engine for compliance alerts

### P3 - Future
- GPS/Telematics simulation
- Document versioning
- Soft delete & audit logs
- Multi-tenant architecture

## Test Credentials
- **Email:** admin@erp.com
- **Password:** password123

## Project Structure
```
/app/
├── backend/
│   ├── server.py      # FastAPI app with all routes
│   ├── models.py      # Pydantic models
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/     # React components for each module
        ├── components/# Layout, UI components
        └── utils/     # API utilities
```
