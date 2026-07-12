import { env, isDev, isTestEnv } from '../env.ts'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ZodError } from 'zod'
import { allocationRoutes } from './routes/allocations.ts'
import { assetRoutes } from './routes/assets.ts'
import { auditRoutes } from './routes/audits.ts'
import { authRoutes } from './routes/auth.ts'
import { bookingRoutes } from './routes/bookings.ts'
import { dashboardRoutes } from './routes/dashboard.ts'
import { maintenanceRoutes } from './routes/maintenance.ts'
import { notificationRoutes } from './routes/notifications.ts'
import { organizationRoutes } from './routes/organization.ts'
import { reportRoutes } from './routes/reports.ts'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('dev', {
    skip: () => isTestEnv(),
  })
)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AssetFlow API',
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/organization', organizationRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/allocations', allocationRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/audits', auditRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/notifications', notificationRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  })
})

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        issues: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    console.error(err.stack)
    res.status(500).json({
      error: 'Something went wrong!',
      ...(isDev() && { details: err.message }),
    })
  }
)

export { app }

export default app
