import { env } from '../../env.ts'
import { createPrismaClient } from './create-prisma.ts'

export const prisma = createPrismaClient(env.DATABASE_URL)
