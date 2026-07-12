import { env as loadEnv } from 'custom-env'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const loadCustomEnv = loadEnv as unknown as (
  stage?: string,
  path?: string,
  defaultEnvFallback?: boolean
) => void

process.env.APP_STAGE = process.env.APP_STAGE || 'dev'

const isProduction = process.env.APP_STAGE === 'production'
const isDevelopment = process.env.APP_STAGE === 'dev'
const isTest = process.env.APP_STAGE === 'test'
const serverDir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(serverDir, 'src')

function loadEnvFrom(path: string, stage?: string) {
  const fileName = stage ? `.env.${stage}` : '.env'

  if (existsSync(join(path, fileName)) || existsSync(join(path, '.env'))) {
    loadCustomEnv(stage, path)
  }
}

// Load .env file
if (isDevelopment) {
  loadEnvFrom(serverDir)
  loadEnvFrom(srcDir)
} else if (isTest) {
  loadEnvFrom(serverDir, 'test')
  loadEnvFrom(srcDir, 'test')
}

const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  APP_STAGE: z.enum(['dev', 'production', 'test']).default('dev'),

  // Server
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default('localhost'),

  DATABASE_URL: z
    .string()
    .startsWith('postgresql://')
    .default('postgresql://postgres:postgres@localhost:5432/assetflow'),
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().positive().default(10),

  AUTH_SECRET: z.string().min(32).default('assetflow-dev-secret-change-before-production'),

  // CORS
  CORS_ORIGIN: z
    .union([z.string(), z.array(z.string())])
    .default('http://localhost:5173')
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').map((origin) => origin.trim())
      }
      return val
    }),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'trace'])
    .default(isProduction ? 'info' : 'debug'),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(z.treeifyError(error)))

    // More detailed error messages
    error.issues.forEach((err) => {
      const path = err.path.join('.')
      console.error(`  ${path}: ${err.message}`)
    })

    process.exit(1)
  }
  throw error
}

// Helper functions for environment checks
export const isProd = () => env.NODE_ENV === 'production'
export const isDev = () => env.NODE_ENV === 'development'
export const isTestEnv = () => env.NODE_ENV === 'test'

// Export the validated environment object
export { env }

// Default export for convenience
export default env
