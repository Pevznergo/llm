'use client'

import { X } from 'lucide-react'
import MatchGame from './MatchGame'

interface MatchGameModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function MatchGameModal({ isOpen, onClose }: MatchGameModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>

                <MatchGame />
            </div>
        </div>
    )
}
