import React, { useState } from 'react'
import { adminLogin } from '../../utils/shopApi'
import { Lock, User, Eye, EyeOff, Leaf } from 'lucide-react'

interface Props {
  onLogin: (username: string) => void
}

export default function AdminLoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('Please enter both fields'); return }
    setLoading(true)
    setError('')
    try {
      const res = await adminLogin(username, password)
      onLogin(res.username)
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#344e41] via-[#48634A] to-[#52796f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Nivara Admin</h1>
          <p className="text-white/70 text-sm mt-1">Product & Order Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[#344e41] mb-6 text-center">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#344e41] mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 border border-[#c9d7c3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#344e41] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-[#c9d7c3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#48634A]"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#48634A] text-white rounded-xl font-semibold hover:bg-[#344e41] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-5">Default: admin / nivara@admin123</p>
        </div>
      </div>
    </div>
  )
}
