'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, X } from 'lucide-react'
import MatchModal from '@/components/vibeflow/MatchModal'

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

export default function PartnerSwiper({ onDiscountChange }: { onDiscountChange?: (discount: string) => void }) {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

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
    }, [])

    const handlePass = () => {
        setCurrentCardIndex(prev => (prev + 1) % partners.length)
    }

    const handleLike = () => {
        setSelectedPartner(currentCard)
        setIsMatchModalOpen(true)
    }

    const [platformTariffs, setPlatformTariffs] = useState<Tariff[]>([])

    useEffect(() => {
        // Fetch platform tariffs (default to vibeflow for now as we are in the swiper context)
        // In a real app, this might come from a context or prop
        fetch('/api/tariffs/vibeflow')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlatformTariffs(data)
            })
            .catch(err => console.error('Failed to fetch platform tariffs:', err))
    }, [])

    const currentCard = partners[currentCardIndex]

    // Calculate dynamic savings (annual, combined max)
    const savingsDisplay = (() => {
        if (!currentCard?.tariffs?.length || !platformTariffs.length) return null

        const calculateMaxSavings = (tariffs: Tariff[]) => {
            let maxSavings = 0

            // Group by type/name to find corresponding monthly/yearly pairs if needed, 
            // but for now we just look for the single tariff that offers the absolute most savings annually
            for (const tariff of tariffs) {
                let savings = 0
                const price = Number(tariff.price)
                const originalPrice = Number(tariff.original_price)

                if (tariff.billing_period === 'yearly') {
                    // DB stores monthly price, so annual savings is monthly diff * 12
                    savings = (originalPrice - price) * 12
                } else {
                    // Monthly * 12
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

        return currentCard.discount // Fallback
    })()

    // Notify parent about discount change
    useEffect(() => {
        if (onDiscountChange && savingsDisplay) {
            onDiscountChange(savingsDisplay)
        }
    }, [savingsDisplay, onDiscountChange])

    if (loading) {
        return <div className="text-center text-gray-600 font-medium">Loading partners...</div>
    }

    if (partners.length === 0) {
        return <div className="text-center text-gray-600 font-medium">No partners found.</div>
    }

    return (
        <>
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 hover:shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
                style={{
                    width: 'min(calc(85vh * 9 / 16), calc(100vw - 4rem))',
                    aspectRatio: '9/16'
                }}>
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={currentCard.logo}
                        alt={currentCard.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </div>

                {/* Discount Badge - iOS Style with Animation */}
                <div className="absolute top-6 right-6 z-10">
                    <div className="relative">
                        {/* Pulsing glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                        {/* Main badge */}
                        <div className="relative bg-gradient-to-br from-pink-500 to-orange-500 text-white px-5 py-2.5 rounded-full font-black text-base shadow-2xl border-2 border-white/50 animate-[bounce_2s_ease-in-out_infinite]">
                            {savingsDisplay}
                        </div>
                    </div>
                </div>

                {/* Partner Info Overlay - iOS Frosted Glass */}
                <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                        <div className="mb-4">
                            <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">
                                {currentCard.name}
                            </h3>
                            <p className="text-white/80 text-base font-medium mb-1">
                                {currentCard.age}
                            </p>
                            <p className="text-white/90 text-sm leading-relaxed mb-3 line-clamp-3">
                                {currentCard.bio}
                            </p>
                        </div>

                        {/* Action Buttons - iOS Style */}
                        <div className="flex justify-center gap-5 pt-4">
                            <button
                                onClick={handlePass}
                                className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                                aria-label="Pass"
                            >
                                <X className="w-7 h-7 text-white stroke-[2.5]" />
                            </button>
                            <button
                                onClick={handleLike}
                                className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-pink-300/50 hover:from-pink-600 hover:to-pink-700 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl"
                                aria-label="Like"
                            >
                                <Heart className="w-7 h-7 text-white fill-current" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Modal for Tariff Selection */}
            {selectedPartner && (
                <MatchModal
                    isOpen={isMatchModalOpen}
                    onClose={() => setIsMatchModalOpen(false)}
                    partner={selectedPartner}
                />
            )}
        </>
    )
}
