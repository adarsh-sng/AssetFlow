import { defineConfig } from 'prisma/config'
import { env as loadEnv } from 'custom-env'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const loadCustomEnv = loadEnv as unknown as (
  stage?: string,
  path?: string,
  defaultEnvFallback?: boolean
) => void

const serverDir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(serverDir, 'src')

function loadEnvFrom(path: string) {
  if (existsSync(join(path, '.env'))) {
    loadCustomEnv(undefined, path)
  }
}

loadEnvFrom(serverDir)
loadEnvFrom(srcDir)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/assetflow',
  },
})
