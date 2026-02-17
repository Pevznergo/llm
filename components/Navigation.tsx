'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { sendGTMEvent } from '@/lib/gtm'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
              <span className="font-bold text-black text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Aporto</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('catalog')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">The Stack</button>
            <button onClick={() => scrollToSection('value-prop')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">For Communities</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">FAQ</button>

            <button
              onClick={() => {
                sendGTMEvent({ event: 'cta_click', location: 'navigation', label: 'partner_with_us' })
                window.dispatchEvent(new CustomEvent('openBookingModal'))
              }}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-black bg-white hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Partner With Us
            </button>
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4 bg-black/90 backdrop-blur-xl absolute top-20 left-0 w-full px-4 border-b border-white/10 shadow-xl">
            <button onClick={() => scrollToSection('catalog')} className="block w-full text-left py-2 text-gray-300 hover:text-white font-medium">The Stack</button>
            <button onClick={() => scrollToSection('value-prop')} className="block w-full text-left py-2 text-gray-300 hover:text-white font-medium">For Communities</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 text-gray-300 hover:text-white font-medium">FAQ</button>
            <button
              onClick={() => {
                sendGTMEvent({ event: 'cta_click', location: 'mobile_menu', label: 'partner_with_us' })
                window.dispatchEvent(new CustomEvent('openBookingModal'))
              }}
              className="w-full bg-white text-black px-6 py-3 rounded-xl font-bold mt-2 shadow-lg"
            >
              Partner With Us
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
