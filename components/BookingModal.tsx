'use client'

import { X } from 'lucide-react'
import { sendGTMEvent } from '@/lib/gtm'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl h-[80vh] bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white">Book a Conversation</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 w-full h-full bg-[#18181b] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h4 className="text-2xl font-bold text-white mb-3">Schedule Your Call</h4>
                    <p className="text-gray-400 max-w-md mb-8">
                        Select a time that works best for you. We'll discuss how Aporto can help you recover lost revenue.
                    </p>

                    <a
                        href="https://calendar.app.google/Rsh5hbc8fVBu2jYi7"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => sendGTMEvent({ event: 'booking_calendar_open', location: 'modal' })}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
                    >
                        View Available Times
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    )
}
