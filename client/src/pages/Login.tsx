import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Hexagon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-light text-foreground">
            AssetFlow <span className="text-foreground/40">— login</span>
          </h1>
        </div>

        <div className="flex justify-center">
          <div className="grid size-16 place-items-center border border-foreground bg-accent text-white">
            <Hexagon size={28} strokeWidth={2.5} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none placeholder:text-foreground/30 focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              className="w-full border border-border-subtle bg-white px-4 py-3 text-sm outline-none placeholder:text-foreground/30 focus:border-accent transition-colors"
            />
          </div>

          <div className="text-right">
            <button type="button" className="text-xs text-foreground/50 hover:text-foreground transition-colors">
              Forgot password
            </button>
          </div>

          {error && (
            <div className="border border-accent-subtle bg-accent-muted px-4 py-3 text-sm text-accent">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-foreground bg-foreground px-4 py-3 text-sm font-bold text-background uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-2xs font-bold uppercase tracking-widest text-foreground/40">
              New here?
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="text-center">
            <p className="mb-4 text-sm text-foreground/50">
              Sign up creates an employee account.
              <br />
              Admin roles assigned later.
            </p>
            <Link
              to="/signup"
              className="inline-block w-full border border-accent bg-accent px-4 py-3 text-sm font-bold text-white uppercase tracking-widest text-center hover:bg-accent/90 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
