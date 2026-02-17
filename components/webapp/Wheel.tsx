'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Prize {
    id: number
    name: string
    color?: string
}

interface WheelProps {
    prizes: Prize[]
    onSpinEnd: () => void
    spinning: boolean
    winIndex: number | null // The index of the prize to land on
}

const COLORS = [
    '#FF4136', '#FFDC00', '#2ECC40', '#0074D9', '#B10DC9', '#FF851B', '#39CCCC', '#F012BE'
]

export default function Wheel({ prizes, onSpinEnd, spinning, winIndex }: WheelProps) {
    const controls = useAnimation()
    const [rotation, setRotation] = useState(0)

    useEffect(() => {
        if (spinning && winIndex !== null) {
            spinTo(winIndex)
        }
    }, [spinning, winIndex])

    const spinTo = async (index: number) => {
        const segmentAngle = 360 / prizes.length

        // Correction to align selected segment to the top pointer
        // The wheel starts with segment 0 at [0, segmentAngle]? 
        // Usually 0 is at 3 o'clock in SVG, but let's assume standard rotation.
        // If we build SVG sectors starting from -90deg (top).
        // Let's assume standard setup.
        // Target is `index`.

        // We want the wheel's rotation to end such that the POINTER (fixed at top) points to CENTER of prize[index].
        // Pointer is at -90deg (12 o'clock) relative to circle center logic or just strict top.

        // Let's say we rotate the CONTAINER.
        // To bring segment `i` to top:
        // Angle to rotate = (360 - (i * segmentAngle + segmentAngle / 2)) 
        // + random jitter within segment? (Not needed for simple version)
        // + extra spins (360 * 5)

        const targetAngle = 360 * 5 + (360 - (index * segmentAngle + segmentAngle / 2))

        // Animate
        await controls.start({
            rotate: rotation + targetAngle,
            transition: { duration: 4, ease: "circOut" }
        })

        setRotation(rotation + targetAngle)
        onSpinEnd()
    }

    // Generate SVG paths
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent)
        const y = Math.sin(2 * Math.PI * percent)
        return [x, y]
    }

    const paths = prizes.map((prize, i) => {
        const startAngle = i / prizes.length
        const endAngle = (i + 1) / prizes.length

        const [startX, startY] = getCoordinatesForPercent(startAngle)
        const [endX, endY] = getCoordinatesForPercent(endAngle)

        const largeArcFlag = 1 / prizes.length > 0.5 ? 1 : 0

        const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
        ].join(' ')

        return { pathData, color: COLORS[i % COLORS.length] }
    })

    return (
        <div className="relative w-80 h-80 mx-auto">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-8 h-10">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-md"></div>
            </div>

            {/* Wheel */}
            <motion.div
                className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden"
                animate={controls}
                initial={{ rotate: 0 }}
            >
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                    {paths.map((p, i) => (
                        <g key={i}>
                            <path d={p.pathData} fill={p.color} stroke="white" strokeWidth="0.02" />
                            {/* Text Label - simplified position calc */}
                            <text
                                x={(Math.cos(2 * Math.PI * (i + 0.5) / prizes.length) * 0.6)}
                                y={(Math.sin(2 * Math.PI * (i + 0.5) / prizes.length) * 0.6)}
                                fontSize="0.12"
                                fill="white"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                transform={`rotate(${(i + 0.5) * (360 / prizes.length)}, 0, 0)`} // Just easier to not rotate text in simple svg? No, text needs rotation
                                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                            >
                                {/* Shorten name or allow css wrap? SVG text is hard. Just first word or ID */}
                                {/* Actually, rotation logic for text is tricky in pure SVG coords without rotation transform on element. 
                            Let's rely on short names or icons.
                         */}
                                {prizes[i].name.substring(0, 10)}
                            </text>
                        </g>
                    ))}
                </svg>
            </motion.div>
        </div>
    )
}
