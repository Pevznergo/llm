'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Всегда показываем требуемую ошибку независимо от значения
    setError('Enter valid Inveite code')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">Register</h2>
          <p className="text-gray-300">Enter your email and invite code</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all text-gray-100 bg-white/5 placeholder:text-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="invite" className="block text-sm font-medium text-gray-300 mb-2">
              Invite code
            </label>
            <input
              id="invite"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-transparent outline-none transition-all text-gray-100 bg-white/5 placeholder:text-gray-400"
              placeholder="XXXX-XXXX"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
          >
            Register
          </button>
        </form>


      </div>
    </div>
  )
}
