'use client'

import { useState, FormEvent } from 'react'
import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@krater.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
        callbackURL: '/settings',
      })

      if (signInError) {
        setError(signInError.message || 'Failed to sign in')
      } else {
        router.push('/settings')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-(--background)">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="p-8 bg-(--card) border border-(--border) rounded-lg shadow-lg"
        >
          <h1 className="text-2xl font-bold mb-6 text-(--foreground)">Admin Login</h1>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-(--foreground)">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-(--border) rounded-md bg-(--background) text-(--foreground) focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-(--foreground)"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-(--border) rounded-md bg-(--background) text-(--foreground) focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-4 text-sm text-(--muted-foreground) text-center">
            Default credentials: admin@krater.local /{' '}
            {process.env.NODE_ENV === 'development' ? 'admin123' : '[set via env]'}
          </p>
        </form>
      </div>
    </div>
  )
}
