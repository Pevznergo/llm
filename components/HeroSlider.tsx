'use client'

import { useState, useEffect } from 'react'

interface HeroSliderProps {
  beforeImage: string
  afterImage: string
}

export default function HeroSlider({ beforeImage, afterImage }: HeroSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  // Сбрасываем позицию слайдера при смене изображения
  useEffect(() => {
    setSliderPosition(50)
  }, [beforeImage, afterImage])

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

  // Определяем соотношение сторон на основе URL изображения
  const isLandscape = beforeImage.includes('1000&h=800')
  const aspectRatio = isLandscape ? 'aspect-[5/4]' : 'aspect-[3/4]'

  return (
    <div
      className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-2xl transition-all`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onClick={handleClick}
    >
      {/* After Image (Full) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      
      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Handle */}
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

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
        Before
      </div>
      <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
        After
      </div>
    </div>
  )
}
