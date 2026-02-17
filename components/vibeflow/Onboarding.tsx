'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const HASHTAGS = [
    "#NoCode", "#AI", "#Automation",
    "#SaaS", "#Design", "#Marketing",
    "#Startup", "#Growth", "#Tech"
]

interface OnboardingProps {
    onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag))
        } else {
            if (selectedTags.length < 5) {
                setSelectedTags(prev => [...prev, tag])
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-2">Welcome to VibeFlow</h1>
                <p className="text-gray-400 mb-8">Customize your feed. Select up to 5 interests.</p>

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {HASHTAGS.map(tag => {
                        const isSelected = selectedTags.includes(tag)
                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 border ${isSelected
                                        ? 'bg-white text-black border-white scale-105'
                                        : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {tag}
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={onComplete}
                    disabled={selectedTags.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedTags.length > 0
                            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-red-500/30 hover:scale-105'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Start Watching
                </button>
            </div>
        </div>
    )
}
