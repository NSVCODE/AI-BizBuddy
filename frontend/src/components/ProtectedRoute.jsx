import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C18] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return children
}
