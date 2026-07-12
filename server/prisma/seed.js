import { createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const databaseUrl =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/assetflow'

const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
})

const passwordHash = (password) => `sha256:${createHash('sha256').update(password).digest('hex')}`

const byName = (records, name) => {
    const record = records.find((item) => item.name === name)

    if (!record) {
        throw new Error(`Missing seeded record: ${name}`)
    }

    return record
}

async function clearData() {
    await prisma.activityLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.auditAssignment.deleteMany()
    await prisma.auditItem.deleteMany()
    await prisma.auditCycle.deleteMany()
    await prisma.maintenanceRequest.deleteMany()
    await prisma.resourceBooking.deleteMany()
    await prisma.transferRequest.deleteMany()
    await prisma.assetAllocation.deleteMany()
    await prisma.asset.deleteMany()
    await prisma.assetCategory.deleteMany()
    await prisma.department.updateMany({ data: { parentId: null, headId: null } })
    await prisma.employee.deleteMany()
    await prisma.department.deleteMany()
}

async function seedDepartments() {
    const engineering = await prisma.department.create({
        data: { name: 'Engineering', status: 'ACTIVE' },
    })

    const facilities = await prisma.department.create({
        data: { name: 'Facilities', status: 'ACTIVE' },
    })

    const fieldOps = await prisma.department.create({
        data: { name: 'Field Ops', status: 'ACTIVE' },
    })

    const fieldOpsEast = await prisma.department.create({
        data: {
            name: 'Field Ops East',
            status: 'ACTIVE',
            parentId: fieldOps.id,
        },
    })

    return { engineering, facilities, fieldOps, fieldOpsEast }
}

async function seedEmployees(departments) {
    const employees = await Promise.all([
        prisma.employee.create({
            data: {
                name: 'Admin Demo',
                email: 'admin@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'ADMIN',
                departmentId: departments.engineering.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Rohan Mehta',
                email: 'rohan@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'ASSET_MANAGER',
                departmentId: departments.facilities.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Aditi Rao',
                email: 'aditi@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'DEPARTMENT_HEAD',
                departmentId: departments.engineering.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Sana Iqbal',
                email: 'sana@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'DEPARTMENT_HEAD',
                departmentId: departments.fieldOpsEast.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Priya Shah',
                email: 'priya@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'EMPLOYEE',
                departmentId: departments.engineering.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Raj Mehta',
                email: 'raj@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'EMPLOYEE',
                departmentId: departments.engineering.id,
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Arjun Nair',
                email: 'arjun@assetflow.local',
                passwordHash: passwordHash('password123'),
                role: 'EMPLOYEE',
                status: 'INACTIVE',
                departmentId: departments.facilities.id,
            },
        }),
    ])

    await Promise.all([
        prisma.department.update({
            where: { id: departments.engineering.id },
            data: { headId: byName(employees, 'Aditi Rao').id },
        }),
        prisma.department.update({
            where: { id: departments.facilities.id },
            data: { headId: byName(employees, 'Rohan Mehta').id },
        }),
        prisma.department.update({
            where: { id: departments.fieldOpsEast.id },
            data: { headId: byName(employees, 'Sana Iqbal').id },
        }),
    ])

    return {
        admin: byName(employees, 'Admin Demo'),
        assetManager: byName(employees, 'Rohan Mehta'),
        engineeringHead: byName(employees, 'Aditi Rao'),
        fieldOpsHead: byName(employees, 'Sana Iqbal'),
        priya: byName(employees, 'Priya Shah'),
        raj: byName(employees, 'Raj Mehta'),
        arjun: byName(employees, 'Arjun Nair'),
    }
}

async function seedCategories() {
    const records = await Promise.all([
        prisma.assetCategory.create({
            data: {
                name: 'Electronics',
                description: 'Laptops, monitors, projectors, printers, and peripherals',
                customFields: { warrantyPeriodMonths: 36 },
            },
        }),
        prisma.assetCategory.create({
            data: {
                name: 'Furniture',
                description: 'Chairs, desks, cabinets, and fixtures',
            },
        }),
        prisma.assetCategory.create({
            data: {
                name: 'Vehicles',
                description: 'Fleet vehicles and logistics equipment',
                defaultBookable: true,
            },
        }),
        prisma.assetCategory.create({
            data: {
                name: 'Rooms',
                description: 'Shared meeting rooms and workspaces',
                defaultBookable: true,
            },
        }),
    ])

    return {
        electronics: byName(records, 'Electronics'),
        furniture: byName(records, 'Furniture'),
        vehicles: byName(records, 'Vehicles'),
        rooms: byName(records, 'Rooms'),
    }
}

async function seedAssets(categories, departments) {
    const assets = await Promise.all([
        prisma.asset.create({
            data: {
                tag: 'AF-0114',
                name: 'Dell Laptop',
                serialNumber: 'DL-2026-0114',
                qrCode: 'assetflow://asset/AF-0114',
                status: 'ALLOCATED',
                condition: 'Good',
                location: 'Bengaluru HQ Floor 2',
                acquisitionDate: new Date('2024-03-12T00:00:00.000Z'),
                acquisitionCost: '95000.00',
                categoryId: categories.electronics.id,
                departmentId: departments.engineering.id,
            },
        }),
        prisma.asset.create({
            data: {
                tag: 'AF-0062',
                name: 'Projector',
                serialNumber: 'PRJ-0062',
                qrCode: 'assetflow://asset/AF-0062',
                status: 'UNDER_MAINTENANCE',
                condition: 'Bulb issue',
                location: 'Bengaluru HQ Floor 2',
                acquisitionDate: new Date('2023-01-04T00:00:00.000Z'),
                acquisitionCost: '48000.00',
                isBookable: true,
                categoryId: categories.electronics.id,
                departmentId: departments.facilities.id,
            },
        }),
        prisma.asset.create({
            data: {
                tag: 'AF-0201',
                name: 'Office Chair',
                serialNumber: 'CHR-0201',
                status: 'AVAILABLE',
                condition: 'Good',
                location: 'Warehouse',
                acquisitionCost: '8500.00',
                categoryId: categories.furniture.id,
                departmentId: departments.facilities.id,
            },
        }),
        prisma.asset.create({
            data: {
                tag: 'AF-ROOM-B2',
                name: 'Conference Room B2',
                serialNumber: 'ROOM-B2',
                status: 'AVAILABLE',
                condition: 'Ready',
                location: 'Bengaluru HQ Floor 3',
                isBookable: true,
                categoryId: categories.rooms.id,
                departmentId: departments.facilities.id,
            },
        }),
        prisma.asset.create({
            data: {
                tag: 'AF-0087',
                name: 'Forklift',
                serialNumber: 'FLT-0087',
                status: 'AVAILABLE',
                condition: 'Service due soon',
                location: 'Warehouse',
                acquisitionDate: new Date('2021-07-02T00:00:00.000Z'),
                acquisitionCost: '640000.00',
                isBookable: true,
                categoryId: categories.vehicles.id,
                departmentId: departments.fieldOps.id,
            },
        }),
        prisma.asset.create({
            data: {
                tag: 'AF-0301',
                name: 'Camera',
                serialNumber: 'CAM-0301',
                status: 'AVAILABLE',
                condition: 'Idle',
                location: 'Media Store',
                acquisitionCost: '62000.00',
                categoryId: categories.electronics.id,
                departmentId: departments.engineering.id,
            },
        }),
    ])

    return Object.fromEntries(assets.map((asset) => [asset.tag, asset]))
}

async function seedWorkflows(assets, employees, departments) {
    const priyaAllocation = await prisma.assetAllocation.create({
        data: {
            assetId: assets['AF-0114'].id,
            targetType: 'EMPLOYEE',
            employeeId: employees.priya.id,
            status: 'ACTIVE',
            allocatedAt: new Date('2026-03-12T04:30:00.000Z'),
            expectedReturnAt: new Date('2026-07-09T12:30:00.000Z'),
            checkOutNotes: 'Issued for engineering sprint work.',
            createdById: employees.assetManager.id,
        },
    })

    await prisma.assetAllocation.create({
        data: {
            assetId: assets['AF-0201'].id,
            targetType: 'DEPARTMENT',
            departmentId: departments.facilities.id,
            status: 'RETURNED',
            allocatedAt: new Date('2026-01-04T04:30:00.000Z'),
            returnedAt: new Date('2026-02-14T11:30:00.000Z'),
            checkInNotes: 'Returned by Arjun Nair. Condition: good.',
            returnCondition: 'Good',
            createdById: employees.assetManager.id,
        },
    })

    await prisma.transferRequest.create({
        data: {
            assetId: assets['AF-0114'].id,
            fromAllocationId: priyaAllocation.id,
            toTargetType: 'EMPLOYEE',
            toEmployeeId: employees.raj.id,
            reason: 'Raj needs the laptop for the client demo environment.',
            status: 'REQUESTED',
            requestedById: employees.raj.id,
        },
    })

    await prisma.resourceBooking.create({
        data: {
            assetId: assets['AF-ROOM-B2'].id,
            requestedById: employees.assetManager.id,
            title: 'Procurement Team',
            status: 'COMPLETED',
            startsAt: new Date('2026-07-07T03:30:00.000Z'),
            endsAt: new Date('2026-07-07T04:30:00.000Z'),
            location: 'Conference Room B2',
            notes: 'Existing mockup booking used to validate overlap rules.',
        },
    })

    await prisma.resourceBooking.create({
        data: {
            assetId: assets['AF-ROOM-B2'].id,
            requestedById: employees.engineeringHead.id,
            title: 'Engineering Planning',
            status: 'UPCOMING',
            startsAt: new Date('2026-07-14T08:30:00.000Z'),
            endsAt: new Date('2026-07-14T09:30:00.000Z'),
            location: 'Conference Room B2',
            reminderAt: new Date('2026-07-14T08:15:00.000Z'),
        },
    })

    await Promise.all([
        prisma.maintenanceRequest.create({
            data: {
                assetId: assets['AF-0062'].id,
                issue: 'Projector bulb not turning on',
                description: 'Bulb fails after warmup. Needs approval before repair.',
                priority: 'HIGH',
                status: 'PENDING',
                requestedById: employees.priya.id,
            },
        }),
        prisma.maintenanceRequest.create({
            data: {
                assetId: assets['AF-0087'].id,
                issue: 'Service due in 5 days',
                description: 'Preventive service window required.',
                priority: 'MEDIUM',
                status: 'TECHNICIAN_ASSIGNED',
                requestedById: employees.assetManager.id,
                approvedById: employees.assetManager.id,
                technicianId: employees.fieldOpsHead.id,
                approvedAt: new Date('2026-07-10T05:30:00.000Z'),
            },
        }),
        prisma.maintenanceRequest.create({
            data: {
                assetId: assets['AF-0201'].id,
                issue: 'Chair repair resolved',
                description: 'Loose armrest fixed.',
                priority: 'LOW',
                status: 'RESOLVED',
                requestedById: employees.arjun.id,
                approvedById: employees.assetManager.id,
                technicianId: employees.assetManager.id,
                approvedAt: new Date('2026-07-07T04:30:00.000Z'),
                startedAt: new Date('2026-07-07T05:30:00.000Z'),
                resolvedAt: new Date('2026-07-07T07:30:00.000Z'),
                resolutionNote: 'Resolved 7 Jul.',
            },
        }),
    ])

    const audit = await prisma.auditCycle.create({
        data: {
            name: 'Q3 Audit: Engineering Dept',
            status: 'ACTIVE',
            scope: 'Department',
            departmentId: departments.engineering.id,
            location: 'Bengaluru HQ Floor 2',
            startsAt: new Date('2026-07-01T03:30:00.000Z'),
            endsAt: new Date('2026-07-15T12:30:00.000Z'),
        },
    })

    await Promise.all([
        prisma.auditAssignment.create({
            data: { auditId: audit.id, auditorId: employees.engineeringHead.id },
        }),
        prisma.auditAssignment.create({
            data: { auditId: audit.id, auditorId: employees.fieldOpsHead.id },
        }),
        prisma.auditItem.create({
            data: {
                auditId: audit.id,
                assetId: assets['AF-0114'].id,
                expectedLocation: 'Desk E12',
                actualLocation: 'Desk E12',
                status: 'VERIFIED',
                verifiedById: employees.engineeringHead.id,
                verifiedAt: new Date('2026-07-07T06:30:00.000Z'),
            },
        }),
        prisma.auditItem.create({
            data: {
                auditId: audit.id,
                assetId: assets['AF-0301'].id,
                expectedLocation: 'Media Store',
                status: 'MISSING',
                notes: 'Flagged for discrepancy report.',
                verifiedById: employees.fieldOpsHead.id,
                verifiedAt: new Date('2026-07-07T07:00:00.000Z'),
            },
        }),
        prisma.auditItem.create({
            data: {
                auditId: audit.id,
                assetId: assets['AF-0201'].id,
                expectedLocation: 'Desk E14',
                status: 'DAMAGED',
                notes: 'Seat cushion damage found during audit.',
                verifiedById: employees.engineeringHead.id,
                verifiedAt: new Date('2026-07-07T07:15:00.000Z'),
            },
        }),
    ])

    await Promise.all([
        prisma.notification.create({
            data: {
                recipientId: employees.priya.id,
                type: 'ASSET',
                title: 'Asset assigned',
                message: 'Laptop AF-0114 assigned to Priya Shah.',
                entityType: 'ALLOCATION',
                entityId: priyaAllocation.id,
            },
        }),
        prisma.notification.create({
            data: {
                recipientId: employees.assetManager.id,
                type: 'OVERDUE',
                title: 'Overdue return',
                message: 'AF-0114 was due 3 days ago.',
                entityType: 'ALLOCATION',
                entityId: priyaAllocation.id,
            },
        }),
        prisma.notification.create({
            data: {
                recipientId: employees.assetManager.id,
                type: 'AUDIT',
                title: 'Audit discrepancy flagged',
                message: 'AF-0301 was marked missing in Q3 Engineering audit.',
                entityType: 'AUDIT',
                entityId: audit.id,
            },
        }),
    ])

    await Promise.all([
        prisma.activityLog.create({
            data: {
                actorId: employees.assetManager.id,
                action: 'ALLOCATED_ASSET',
                entityType: 'ALLOCATION',
                entityId: priyaAllocation.id,
                description: 'Laptop AF-0114 allocated to Priya Shah.',
            },
        }),
        prisma.activityLog.create({
            data: {
                actorId: employees.assetManager.id,
                action: 'CONFIRMED_BOOKING',
                entityType: 'BOOKING',
                entityId: assets['AF-ROOM-B2'].id,
                description: 'Room B2 booking confirmed for Procurement Team.',
            },
        }),
        prisma.activityLog.create({
            data: {
                actorId: employees.engineeringHead.id,
                action: 'FLAGGED_AUDIT_DISCREPANCY',
                entityType: 'AUDIT',
                entityId: audit.id,
                description: '2 assets flagged in Q3 Engineering audit.',
            },
        }),
    ])
}

async function main() {
    await clearData()

    const departments = await seedDepartments()
    const employees = await seedEmployees(departments)
    const categories = await seedCategories()
    const assets = await seedAssets(categories, departments)

    await seedWorkflows(assets, employees, departments)

    console.log('AssetFlow seed data created.')
    console.log('Demo login emails: admin@assetflow.local, rohan@assetflow.local, priya@assetflow.local')
    console.log('Demo password for all seeded users: password123')
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })