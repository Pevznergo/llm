'use client'

import { Heart, MessageCircle, Share2, Bookmark, Music2 } from 'lucide-react'

interface FeedCardProps {
    title: string
    description: string
    discount?: string
    bgGradient: string
    icon?: React.ReactNode
    isIntro?: boolean
}

export default function FeedCard({ title, description, discount, bgGradient, icon, isIntro }: FeedCardProps) {
    return (
        <div className={`w-full h-full snap-start relative flex items-center justify-center overflow-hidden ${bgGradient}`}>

            {/* Right Sidebar Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors cursor-pointer">
                        <Heart className="w-7 h-7 text-white fill-white/20" />
                    </div>
                    <span className="text-white text-xs font-medium">8.2k</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors cursor-pointer">
                        <MessageCircle className="w-7 h-7 text-white fill-white/20" />
                    </div>
                    <span className="text-white text-xs font-medium">405</span>
                </div>

                <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors cursor-pointer">
                    <Bookmark className="w-7 h-7 text-white fill-white/20" />
                </div>

                <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors cursor-pointer">
                    <Share2 className="w-7 h-7 text-white fill-white/20" />
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
                <div className="max-w-[85%]">
                    <div className="flex items-center gap-3 mb-3">
                        {icon && (
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                {icon}
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-white shadow-black drop-shadow-md">{title}</h2>
                    </div>

                    <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 drop-shadow-sm">
                        {description}
                    </p>

                    {discount && (
                        <div className="inline-flex items-center gap-3 bg-red-600 px-4 py-2 rounded-lg animate-pulse mb-4 shadow-lg shadow-red-900/50">
                            <span className="text-white font-black text-lg">{discount}</span>
                            <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Limited Time Offer</span>
                        </div>
                    )}

                    {!isIntro && (
                        <button className="w-full bg-white text-black font-bold py-3 rounded-xl mt-2 hover:bg-gray-200 transition-colors shadow-lg">
                            Get Deal
                        </button>
                    )}

                    {/* Music Ticker */}
                    <div className="flex items-center gap-2 mt-4 opacity-70">
                        <Music2 className="w-4 h-4 text-white" />
                        <div className="text-white text-xs overflow-hidden w-32">
                            <div className="whitespace-nowrap animate-marquee">
                                Original Sound - VibeFlow Trending • VibeFlow •
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
