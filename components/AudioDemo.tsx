'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

export default function AudioDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeLine, setActiveLine] = useState(-1)
  
  // Simulated audio duration in seconds
  const DURATION = 15 
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + (100 / (DURATION * 10)) // Update every 100ms
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  // Sync transcript with progress
  useEffect(() => {
    if (progress < 10) setActiveLine(0) // Intro
    else if (progress < 30) setActiveLine(1) // Customer response
    else if (progress < 80) setActiveLine(2) // AI Pitch
    else if (progress < 100) setActiveLine(3) // Customer interest
    else setActiveLine(-1)
  }, [progress])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col sm:flex-row gap-8 items-center">
          {/* Player Controls */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            <button 
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 group"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white fill-current" />
              ) : (
                <Play className="w-8 h-8 text-white fill-current ml-1" />
              )}
            </button>
            <div className="text-xs text-gray-400 font-mono">AI VOICE AGENT</div>
          </div>

          {/* Visualization & Transcript */}
          <div className="flex-grow w-full space-y-6">
            {/* Waveform Visualization (Simulated) */}
            <div className="h-12 flex items-center gap-1 justify-center sm:justify-start">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-blue-500/50 rounded-full transition-all duration-150"
                  style={{
                    height: isPlaying ? `${Math.random() * 100}%` : '20%',
                    opacity: isPlaying ? 1 : 0.3
                  }}
                />
              ))}
            </div>

            {/* Transcript */}
            <div className="space-y-3 text-sm sm:text-base">
              <TranscriptLine 
                speaker="AI Agent" 
                text="Hi Alex, this is Sarah from [Your App]. I noticed you paused your subscription last month. Was it a budget decision?"
                isActive={activeLine === 0}
              />
              <TranscriptLine 
                speaker="Customer" 
                text="Yeah, we're cutting costs right now."
                isActive={activeLine === 1}
                isRight
              />
              <TranscriptLine 
                speaker="AI Agent" 
                text="Totally understand. What if I told you we partnered with [Partner App] to offer you both tools for less than you were paying for just one? It’s our new 'E-com Recovery Package'. Would that help you restart?"
                isActive={activeLine === 2}
              />
              <TranscriptLine 
                speaker="Customer" 
                text="Wait, really? Tell me more."
                isActive={activeLine === 3}
                isRight
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function TranscriptLine({ speaker, text, isActive, isRight = false }: { speaker: string, text: string, isActive: boolean, isRight?: boolean }) {
  return (
    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
      <span className="text-xs text-gray-500 mb-1">{speaker}</span>
      <div className={`p-3 rounded-2xl max-w-[90%] ${
        isRight 
          ? 'bg-white/10 rounded-tr-sm text-white' 
          : 'bg-blue-500/20 rounded-tl-sm text-blue-100'
      }`}>
        {text}
      </div>
    </div>
  )
}
