# AssetFlow Implementation Plan

This plan turns the Excalidraw mockup and problem statement into a build sequence for the current repo.

Current state:

- `server/` exists with a minimal Express app.
- PostgreSQL is already declared in `server/docker-compose.yml` for local development.
- No frontend app exists yet.
- The mockup covers 10 product screens: login, dashboard, organization setup, assets, allocation, bookings, maintenance, audit, reports, and notifications.

## Product Scope

AssetFlow is an ERP-style asset and shared resource management system for organizations that need to track physical assets, bookings, maintenance, audits, and operational notifications.

The app must support these roles:

- `ADMIN`: manages organization setup, employee roles, audit cycles, and organization-wide analytics.
- `ASSET_MANAGER`: registers assets, allocates assets, approves transfers, approves maintenance, and approves returns.
- `DEPARTMENT_HEAD`: views department assets, approves department allocation or transfer requests, and books shared resources for the department.
- `EMPLOYEE`: views assigned assets, books resources, raises maintenance requests, and starts return or transfer requests.

Important rule: signup always creates a normal employee account. Admin/manager roles are assigned later from the Employee Directory only.

## Recommended Technical Stack

Use the existing backend as the base.

- Backend: Express, TypeScript, Zod
- Database: NeonDB PostgreSQL for the real app, with local PostgreSQL as an optional dev fallback
- ORM: Prisma
- Auth: password hash plus JWT or signed HTTP-only cookie session
- Frontend: React, Vite, TypeScript
- UI: Tailwind CSS, lucide-react icons, dark/light theme tokens
- Charts: Recharts for reports and dashboard visuals
- Validation: Zod on backend route inputs

Database note: this plan treats `neodb` as NeonDB/PostgreSQL. Prisma should use a standard `DATABASE_URL` connection string from NeonDB in deployed or shared environments.

## Build Phases

### Phase 1: Project Foundation

Goal: create a runnable full-stack foundation.

Tasks:

- Add `client/` React Vite app.
- Add Tailwind CSS and base design tokens for a modern Vercel-like dark/light interface.
- Add Prisma to `server/`.
- Add a root-level dev workflow if useful, such as separate `client` and `server` scripts.
- Update backend health check branding from placeholder text to AssetFlow.
- Add `.env.example` values for NeonDB `DATABASE_URL`, auth secret, API port, and client origin.
- Verify backend starts.
- Verify frontend starts.

Acceptance:

- Backend returns `GET /health`.
- Frontend renders a basic AssetFlow app shell.
- Server can connect to NeonDB through Prisma.

### Phase 2: Data Model and Seed Data

Goal: define the ERP entities before building screens.

Core models:

- `Employee`
- `Department`
- `AssetCategory`
- `Asset`
- `AssetAllocation`
- `TransferRequest`
- `ResourceBooking`
- `MaintenanceRequest`
- `AuditCycle`
- `AuditItem`
- `Notification`
- `ActivityLog`

Important enums:

- Employee role: `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`
- User status: `ACTIVE`, `INACTIVE`
- Asset status: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`
- Allocation target type: `EMPLOYEE`, `DEPARTMENT`
- Transfer status: `REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`
- Booking status: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`
- Maintenance status: `PENDING`, `APPROVED`, `REJECTED`, `TECHNICIAN_ASSIGNED`, `IN_PROGRESS`, `RESOLVED`
- Audit item status: `PENDING`, `VERIFIED`, `MISSING`, `DAMAGED`
- Notification type: `ASSET`, `BOOKING`, `MAINTENANCE`, `TRANSFER`, `AUDIT`, `OVERDUE`

Seed data:

- Admin user
- Asset manager user
- Department head user
- Employee users such as Priya Shah, Raj, Aditi Rao, Rohan Mehta, Sana Iqbal
- Departments: Engineering, Facilities, Field Ops, Field Ops East
- Categories: Electronics, Furniture, Vehicles, Rooms
- Assets from mockup, including `AF-0114`, `AF-0062`, `AF-0201`, and Room B2
- Existing allocation where Priya holds `AF-0114`
- Existing booking for Room B2 from 9:00 to 10:00
- Sample maintenance cards for the kanban screen
- Sample audit cycle and discrepancy items

Acceptance:

- Database can be migrated and seeded from scratch.
- Seeded data supports every mockup screen.

### Phase 3: Authentication and Role-Based Access

Goal: implement realistic account creation and access control.

Backend:

- `POST /api/auth/signup`: creates an employee only.
- `POST /api/auth/login`: validates email and password.
- `POST /api/auth/logout`: clears session.
- `GET /api/auth/me`: returns current user and role.
- Auth middleware for protected routes.
- Role middleware for admin and manager workflows.

Frontend:

- Login screen matching mockup.
- Signup screen with no role selector.
- Session persistence.
- Protected routes.
- Sidebar filters based on role.

Acceptance:

- New signup cannot self-select admin.
- Admin-only screens reject normal employee users.
- Logged-in user can reload page and remain authenticated.

### Phase 4: App Shell and Dashboard

Goal: build the mockup's operational home screen.

Frontend:

- Left sidebar navigation.
- Main content shell.
- Dashboard KPI cards:
  - Assets Available
  - Assets Allocated
  - Maintenance Today
  - Active Bookings
  - Pending Transfers
  - Upcoming Returns
- Overdue return alert band.
- Quick actions:
  - Register Asset
  - Book Resource
  - Raise Maintenance Request
- Recent activity feed.

Backend:

- `GET /api/dashboard/summary`
- `GET /api/activity/recent`

Acceptance:

- Dashboard numbers come from database.
- Overdue returns are separate from upcoming returns.
- Quick actions route to the correct screens.

### Phase 5: Organization Setup

Goal: create the admin master-data screen that drives later forms.

Routes and UI:

- `/organization`
- Tabs: Departments, Categories, Employees

Backend:

- Departments:
  - `GET /api/departments`
  - `POST /api/departments`
  - `PATCH /api/departments/:id`
  - deactivate instead of hard delete
- Categories:
  - `GET /api/categories`
  - `POST /api/categories`
  - `PATCH /api/categories/:id`
- Employees:
  - `GET /api/employees`
  - `PATCH /api/employees/:id`
  - role promotion happens only here

Acceptance:

- Departments and categories populate asset forms.
- Admin can promote employee roles.
- Normal employees cannot access role promotion.

### Phase 6: Asset Registration and Directory

Goal: create central asset registration, search, and status visibility.

Frontend:

- `/assets`
- Search box for tag, serial, QR text.
- Filters for category, status, department, and location.
- Asset table matching mockup.
- Register Asset form.
- Asset detail drawer/page with allocation and maintenance history.

Backend:

- `GET /api/assets`
- `GET /api/assets/:id`
- `POST /api/assets`
- `PATCH /api/assets/:id`
- Asset tag generation, for example `AF-0001`.

Acceptance:

- New asset starts as `AVAILABLE`.
- Asset tag is generated by the system.
- Directory can filter by all required fields.

### Phase 7: Allocation and Transfer

Goal: implement the most important business rule: no double allocation.

Frontend:

- `/allocation`
- Select asset and target employee/department.
- Show current holder when asset is already allocated.
- Offer Transfer Request flow.
- Show allocation history.
- Return flow with condition notes.

Backend:

- `POST /api/allocations`
- `POST /api/allocations/:id/return`
- `GET /api/assets/:id/allocations`
- `POST /api/transfers`
- `PATCH /api/transfers/:id/approve`
- `PATCH /api/transfers/:id/reject`

Business rules:

- Cannot allocate an asset unless its status is `AVAILABLE`.
- If already allocated, return a conflict response with current holder details.
- Approved transfer closes previous allocation, creates new allocation, and updates asset history.
- Return changes asset status back to `AVAILABLE` unless return notes mark a maintenance issue.
- Expected return dates in the past are overdue.

Acceptance:

- `AF-0114` conflict flow from the mockup works.
- Transfer request is created instead of direct reallocation.
- Dashboard and notifications receive overdue return data.

### Phase 8: Resource Booking

Goal: support shared resource bookings with overlap validation.

Frontend:

- `/bookings`
- Resource selector.
- Date selector.
- Timeline/calendar view.
- Booking creation form.
- Conflict message when slot overlaps.

Backend:

- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`

Business rules:

- Only assets marked `isBookable` can be booked.
- A booking overlaps if `newStart < existingEnd` and `newEnd > existingStart`.
- Back-to-back bookings are allowed.
- Cancelled bookings do not block new bookings.

Acceptance:

- Existing 9:00-10:00 Room B2 booking blocks 9:30-10:30.
- Existing 9:00-10:00 Room B2 booking allows 10:00-11:00.

### Phase 9: Maintenance Management

Goal: create the approval-based repair workflow.

Frontend:

- `/maintenance`
- Raise maintenance request form.
- Kanban board columns:
  - Pending
  - Approved
  - Technician Assigned
  - In Progress
  - Resolved
- Rejected requests shown separately or filterable.

Backend:

- `GET /api/maintenance`
- `POST /api/maintenance`
- `PATCH /api/maintenance/:id/approve`
- `PATCH /api/maintenance/:id/reject`
- `PATCH /api/maintenance/:id/assign-technician`
- `PATCH /api/maintenance/:id/start`
- `PATCH /api/maintenance/:id/resolve`

Business rules:

- Approval changes the asset status to `UNDER_MAINTENANCE`.
- Resolution changes the asset status back to `AVAILABLE` unless the asset is lost, retired, or disposed.
- Maintenance history is visible on asset detail.

Acceptance:

- Kanban cards can move through the workflow.
- Asset status updates automatically on approval and resolution.

### Phase 10: Asset Audit

Goal: support structured verification cycles and discrepancy reports.

Frontend:

- `/audit`
- Create audit cycle form.
- Assign auditors.
- Checklist table for expected assets.
- Mark each item as Verified, Missing, or Damaged.
- Discrepancy summary.
- Close audit cycle button.

Backend:

- `GET /api/audits`
- `POST /api/audits`
- `GET /api/audits/:id`
- `PATCH /api/audits/:id/items/:itemId`
- `POST /api/audits/:id/close`

Business rules:

- Closing an audit locks further edits.
- Missing confirmed assets can become `LOST`.
- Damaged confirmed assets can create maintenance follow-up or remain flagged.
- Discrepancy report is generated from non-verified items.

Acceptance:

- Mockup Q3 Engineering audit flow works.
- Closing a cycle prevents further item updates.

### Phase 11: Reports and Analytics

Goal: provide management insight from operational data.

Frontend:

- `/reports`
- Utilization by department chart.
- Maintenance frequency chart.
- Most-used assets.
- Idle assets.
- Assets due for maintenance or nearing retirement.
- Booking heatmap placeholder or simple grid.
- Export report action.

Backend:

- `GET /api/reports/utilization`
- `GET /api/reports/maintenance-frequency`
- `GET /api/reports/asset-usage`
- `GET /api/reports/booking-heatmap`
- `GET /api/reports/export.csv`

Acceptance:

- Reports are derived from real database rows.
- Export produces a usable CSV.

### Phase 12: Notifications and Activity Logs

Goal: make system events visible without digging through records.

Frontend:

- `/notifications`
- Tabs:
  - All
  - Alerts
  - Approvals
  - Bookings
- Activity log list with actor, action, entity, and timestamp.

Backend:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/activity`

Events to create:

- Asset assigned
- Maintenance approved or rejected
- Booking confirmed, cancelled, or reminder due
- Transfer approved
- Overdue return alert
- Audit discrepancy flagged
- Admin role promotion

Acceptance:

- Important workflows create notifications and activity logs.
- Filters match the mockup.

## API and Business Rule Priorities

Build these rules early because they define the product:

1. Signup cannot assign privileged roles.
2. Asset double-allocation is blocked.
3. Transfer requests are required when a held asset changes holder.
4. Shared resource bookings cannot overlap.
5. Maintenance approval controls when an asset enters maintenance status.
6. Overdue returns are computed from expected return date.
7. Audit close locks cycle edits and updates affected asset statuses.
8. Every workflow writes an activity log.

## UI Design Direction From Mockup

The app should feel like a modern Vercel-quality operational ERP tool, not a generic AI-generated dashboard.

- Dense but readable dashboard.
- Left navigation always visible on desktop.
- Compact cards and tables.
- Clear status badges.
- Forms in panels, drawers, or focused pages.
- Avoid marketing-style landing sections.
- Keep screen content task-focused.
- No generic gradient backgrounds, blurry blobs, oversized hero cards, glassmorphism, or decorative AI-dashboard filler.
- Dark theme must be first-class, not an afterthought.
- Light theme must stay crisp and professional.
- Theme switching should be built through semantic tokens, not hard-coded one-off colors.
- Use clean borders, subtle shadows, strong spacing, and restrained motion.

Suggested visual language:

- Dark background: near-black, similar to Vercel-style surfaces.
- Light background: clean neutral white/gray.
- Main panels: slightly elevated neutral surfaces with 1px borders.
- Primary actions: white-on-black in light mode, black-on-white or high-contrast neutral in dark mode.
- Secondary accents: restrained blue/teal only where status or focus needs it.
- Alerts: red/orange for overdue and conflicts.
- Success: green for verified, resolved, active.
- Skin/accent theme: if used, keep it as a subtle warm neutral accent only; do not let beige/tan dominate the product.
- Radius: small, around 6-8px.
- Typography: modern sans-serif, tight but readable hierarchy, no oversized landing-page typography inside operational screens.
- Buttons: icon-leading where useful, compact, and consistent.
- Tables: dense, scannable, sticky headers where useful, clear empty/loading/error states.
- Forms: labels, helper text, inline validation, disabled/loading states, and clear destructive confirmations.

UI acceptance bar:

- Every screen must look intentional in both dark and light modes.
- Text must not overflow buttons, cards, tabs, sidebars, or tables on mobile or desktop.
- Status colors must remain accessible in dark mode.
- The app should feel more like Vercel, Linear, or modern SaaS admin tooling than a template dashboard.

## First Sprint Checklist

Use this as the immediate starting point when implementation begins:

1. Create `client/` with React Vite TypeScript.
2. Install Tailwind, React Router, lucide-react, Recharts, and a theme helper if needed.
3. Create Vercel-like design tokens for dark and light themes before building screens.
4. Add Prisma to `server/`.
5. Configure Prisma for NeonDB via `DATABASE_URL`.
6. Define Prisma schema with all core models and enums.
7. Add seed script with demo data from the mockup.
8. Implement auth routes and role middleware.
9. Build login/signup screens with polished responsive UI.
10. Build app shell and dashboard from live API data.

## Definition of Done for the POC

The POC is done when a reviewer can:

1. Sign up as an employee and verify no role selector exists.
2. Log in as admin and promote an employee in Organization Setup.
3. Register a new asset and see an auto-generated tag.
4. Try allocating an already-held asset and see the conflict with current holder.
5. Submit a transfer request and approve it.
6. Book Room B2 for a valid time.
7. Attempt an overlapping booking and see it rejected.
8. Raise and approve a maintenance request.
9. Resolve maintenance and see the asset return to available.
10. Create and close an audit cycle with discrepancies.
11. View dashboard KPIs, notifications, and activity logs updated by those workflows.
12. Open reports and export at least one CSV report.
