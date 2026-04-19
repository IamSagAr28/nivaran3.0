import React, { useState, useEffect } from 'react'
import AdminLoginPage from './AdminLoginPage'
import AdminDashboard from './AdminDashboard'
import { fetchAdminMe } from '../../utils/shopApi'

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Check if already logged in
  useEffect(() => {
    fetchAdminMe()
      .then(res => setAdminUser(res.username))
      .catch(() => setAdminUser(null))
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#344e41] to-[#48634A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!adminUser) {
    return <AdminLoginPage onLogin={setAdminUser} />
  }

  return <AdminDashboard username={adminUser} onLogout={() => setAdminUser(null)} />
}
