import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const keyLength = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer

  return `scrypt:${salt}:${derivedKey.toString('base64url')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith('sha256:')) {
    const digest = createHash('sha256').update(password).digest('hex')
    return storedHash === `sha256:${digest}`
  }

  const [algorithm, salt, hash] = storedHash.split(':')

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false
  }

  const storedKey = Buffer.from(hash, 'base64url')
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}
