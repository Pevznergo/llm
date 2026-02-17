'use client'

import { useState } from 'react'

interface BeforeAfterProps {
  title: string
  description: string
  beforeImage: string
  afterImage: string
}

export default function BeforeAfter({ title, description, beforeImage, afterImage }: BeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const handleMove = (clientX: number, rect: DOMRect) => {
    const position = ((clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.min(Math.max(position, 0), 100))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    handleMove(e.clientX, rect)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    handleMove(e.touches[0].clientX, rect)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    handleMove(e.clientX, rect)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div
        className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-ew-resize select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
      >
        <div className="absolute inset-0 bg-gray-200">
          <img
            src={afterImage}
            alt="After"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        
        <div
          className="absolute inset-0 bg-gray-300"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white">
            <div className="flex space-x-1">
              <svg width="8" height="16" viewBox="0 0 8 16" fill="none">
                <path d="M0 8L4 4V12L0 8Z" fill="#6366f1"/>
              </svg>
              <svg width="8" height="16" viewBox="0 0 8 16" fill="none">
                <path d="M8 8L4 4V12L8 8Z" fill="#6366f1"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          After
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  )
}
