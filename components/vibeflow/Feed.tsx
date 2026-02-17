'use client'

import { useState, useEffect } from 'react'
import FeedCard from './FeedCard'
import { Zap, Video, Code2, Palette } from 'lucide-react'

interface Partner {
    id: number
    name: string
    bio: string
    discount: string
    logo: string
}

export default function Feed() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)

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

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black">
                <div className="text-white text-xl">Loading partners...</div>
            </div>
        )
    }

    // Icon mapping
    const getIcon = (name: string) => {
        const iconMap: Record<string, any> = {
            'Canva': <Palette className="w-6 h-6 text-white" />,
            'n8n': <Zap className="w-6 h-6 text-white" />,
            'CapCut': <Video className="w-6 h-6 text-white" />,
        }
        return iconMap[name] || <Code2 className="w-6 h-6 text-white" />
    }

    // Gradient mapping
    const getGradient = (name: string) => {
        const gradientMap: Record<string, string> = {
            'Canva': 'bg-gradient-to-br from-blue-400 via-teal-500 to-emerald-600',
            'n8n': 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600',
            'CapCut': 'bg-gradient-to-br from-gray-900 via-gray-800 to-black',
        }
        return gradientMap[name] || 'bg-gradient-to-br from-purple-600 via-pink-600 to-red-600'
    }

    return (
        <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
            {/* First card: Platform intro (get platform from URL) */}
            <FeedCard
                title="VibeFlow"
                description="VibeFlow generates full-stack web apps from prompts with n8n-style visual workflows for the backend. While frontends are easy to iterate, backends remain black boxes. VibeFlow opens up backend logic, making it visual and editable."
                bgGradient="bg-gradient-to-br from-indigo-900 via-purple-900 to-black"
                icon={<Code2 className="w-6 h-6 text-white" />}
                isIntro={true}
            />

            {/* Dynamic partner cards from PostgreSQL */}
            {partners.map((partner) => (
                <FeedCard
                    key={partner.id}
                    title={partner.name}
                    description={partner.bio}
                    discount={partner.discount}
                    bgGradient={getGradient(partner.name)}
                    icon={getIcon(partner.name)}
                />
            ))}
        </div>
    )
}
