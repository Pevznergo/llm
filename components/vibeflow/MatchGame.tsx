'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Heart } from 'lucide-react'
import MatchModal from './MatchModal'

interface Tariff {
    id: number
    name: string
    price: number
    original_price: number
    features: string
    type: string
    billing_period: string
}

interface Partner {
    id: number
    name: string
    age: string
    bio: string
    discount: string
    logo: string
    tariffs: Tariff[]
}

export default function MatchGame() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
    const [matchedPartner, setMatchedPartner] = useState("")
    const [platformTariffs, setPlatformTariffs] = useState<Tariff[]>([])

    useEffect(() => {
        async function fetchPartners() {
            try {
                const res = await fetch('/api/partners', { cache: 'no-store' })
                const data = await res.json()
                if (Array.isArray(data)) {
                    setPartners(data)
                }
            } catch (error) {
                console.error('Failed to fetch partners:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPartners()

        // Fetch platform tariffs
        fetch('/api/tariffs/vibeflow')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlatformTariffs(data)
            })
            .catch(err => console.error('Failed to fetch platform tariffs:', err))
    }, [])

    if (loading) {
        return <div className="text-center text-white py-20">Loading potential matches...</div>
    }

    if (partners.length === 0) {
        return <div className="text-center text-white py-20">No matches found.</div>
    }

    const currentCard = partners[currentCardIndex % partners.length]

    // Calculate dynamic savings (annual, combined max)
    const savingsDisplay = (() => {
        if (!currentCard?.tariffs?.length || !platformTariffs.length) return currentCard.discount

        const calculateMaxSavings = (tariffs: Tariff[]) => {
            let maxSavings = 0
            for (const tariff of tariffs) {
                let savings = 0
                const price = Number(tariff.price)
                const originalPrice = Number(tariff.original_price)

                if (tariff.billing_period === 'yearly') {
                    savings = (originalPrice - price) * 12
                } else {
                    savings = (originalPrice - price) * 12
                }

                if (savings > maxSavings) maxSavings = savings
            }
            return maxSavings
        }

        const partnerSavings = calculateMaxSavings(currentCard.tariffs)
        const platformSavings = calculateMaxSavings(platformTariffs)
        const totalSavings = partnerSavings + platformSavings

        if (totalSavings > 0) return `Save $${Math.round(totalSavings)}`

        return currentCard.discount
    })()

    const handlePass = () => {
        setCurrentCardIndex(prev => prev + 1)
    }

    const handleLike = () => {
        setMatchedPartner(currentCard.name)
        setIsMatchModalOpen(true)
    }

    return (
        <div className="relative mx-auto" style={{ width: 'min(calc(80vh * 9 / 16), calc(100vw - 2rem))', aspectRatio: '9/16' }}>
            <div className="absolute inset-0 bg-black rounded-3xl shadow-2xl overflow-hidden border border-gray-800 flex flex-col relative group">
                {/* Full Screen Image Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={currentCard.logo}
                        alt={currentCard.name}
                        fill
                        className={`object-cover transition-all duration-500 ${isMatchModalOpen ? 'blur-md opacity-40' : 'opacity-60 group-hover:opacity-40'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="px-3 py-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white shadow-sm uppercase tracking-wide">
                            Partner
                        </div>
                        <div className="bg-red-600 text-white px-3 py-1 rounded-lg shadow-lg transform rotate-3 animate-pulse">
                            <span className="font-black text-lg">{savingsDisplay}</span>
                        </div>
                    </div>

                    <div className="mt-auto mb-20">
                        <h3 className="text-3xl font-black text-white mb-1 drop-shadow-lg leading-tight">
                            {currentCard.name}
                        </h3>
                        <p className="text-lg text-white/90 font-medium mb-3">{currentCard.age}</p>

                        <div className="space-y-2">
                            <p className="text-white/80 text-xs leading-relaxed drop-shadow-md line-clamp-3">
                                <span className="font-bold text-white">Bio:</span> {currentCard.bio}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center gap-6 z-20">
                    <button
                        onClick={handlePass}
                        className="w-14 h-14 rounded-full bg-black/40 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all backdrop-blur-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleLike}
                        className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-105 hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                        <Heart className="w-6 h-6 fill-current" />
                    </button>
                </div>
            </div>

            <MatchModal
                isOpen={isMatchModalOpen}
                onClose={() => {
                    setIsMatchModalOpen(false)
                    setCurrentCardIndex(prev => prev + 1)
                }}
                partner={currentCard}
            />
        </div>
    )
}
