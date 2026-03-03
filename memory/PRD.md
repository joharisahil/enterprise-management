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

### 5. Fleet/Vehicle Management (Enhanced)
- [x] Create vehicle with extended fields:
  - Registration Number, Type, Brand, Model, Year
  - Chassis Number, Engine Number, Color
  - Fuel Type, Average km/l, Tank Capacity
  - **NEW:** Owner Name, File Status (Yes/No), Site Name
  - **NEW:** DOR (Date of Registration), Tax Upto, Remark
- [x] View vehicle - Comprehensive report showing:
  - All vehicle details
  - Summary cards (Documents, Challans, Services, Accidents)
  - Tabbed view of all related records
- [x] Edit vehicle with all fields
- [x] Delete vehicle
- [x] **NEW:** Download PDF Report (full vehicle history)
- [x] **NEW:** Export vehicles to CSV
- [x] **NEW:** Import vehicles from CSV
- [x] **NEW:** Download CSV template with sample data

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

### Vehicle Endpoints (New/Updated)
- GET `/api/vehicles` - List all vehicles
- GET `/api/vehicles/{id}` - Get vehicle details
- POST `/api/vehicles` - Create vehicle (with new fields)
- PUT `/api/vehicles/{id}` - Update vehicle (with new fields)
- DELETE `/api/vehicles/{id}` - Delete vehicle
- **NEW:** GET `/api/vehicles/{id}/full-report` - Comprehensive vehicle report
- **NEW:** GET `/api/vehicles/export/csv` - Export all vehicles
- **NEW:** GET `/api/vehicles/template/csv` - Download import template
- **NEW:** POST `/api/vehicles/import/csv` - Import vehicles from CSV

## Completed Work (December 2025)

### Session 1 - Initial Build
- Full-stack scaffolding with FastAPI + React
- Core modules with basic CRUD
- JWT authentication
- Dashboard with analytics

### Session 2 - CRUD Completion
- Added full CRUD operations for Properties
- Added full CRUD for Property Taxes
- Added view/delete for all Utility Bills
- Added full CRUD for Fleet/Vehicles

### Session 3 - Vehicle Module Enhancement
- Added new fields: Owner Name, File Status, Site Name, DOR, Tax Upto, Remark
- Implemented comprehensive View dialog with:
  - All vehicle information
  - Summary statistics
  - Tabbed view of Documents, Challans, Services, Accidents
- Added PDF report download functionality
- Implemented CSV export for vehicles
- Implemented CSV import with template download
- Added sample data in import template

## Test Credentials
- **Email:** admin@erp.com
- **Password:** password123

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
