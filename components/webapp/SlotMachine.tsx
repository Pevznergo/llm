"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface Prize {
    id: number;
    name: string;
    type: string;
    value: string;
    image_url?: string;
}

interface SlotMachineProps {
    prizes: Prize[];
    spinning: boolean;
    winIndex: number | null;
    onSpinEnd: () => void;
}

const CARD_HEIGHT = 180; // Larger cards
const GAP = 20;

export default function SlotMachine({ prizes, spinning, winIndex, onSpinEnd }: SlotMachineProps) {
    // Refs for animation to bypass React Render Cycle (Critical for Telegram Web Performance)
    const stripRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    // Track current position directly in a ref
    const currentOffsetRef = useRef<number>(200);

    // State only for logic/setup, not high-frequency updates
    const [isSpinning, setIsSpinning] = useState(false);

    const ITEM_SIZE = CARD_HEIGHT + GAP;

    // Config: Reduce DOM size for mobile performance
    const REPEAT_COUNT = 14;

    // Memoize the extended prize list
    const extendedPrizes = useMemo(() => {
        return Array(REPEAT_COUNT).fill(prizes).flat();
    }, [prizes]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Refs for items to apply transforming
    const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

    // --- ANIMATION ENGINE (requestAnimationFrame) ---
    // This runs OUTSIDE the React Render Loop for 60fps smoothness
    const animateScroll = (startPos: number, endPos: number, duration: number, onComplete?: () => void) => {
        const startTime = performance.now();

        const tick = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing: QuintOut (Fast start, very slow finish)
            const ease = 1 - Math.pow(1 - progress, 5);

            const currentOffset = startPos + (endPos - startPos) * ease;

            if (stripRef.current) {
                // Force GPU layer with translate3d
                stripRef.current.style.transform = `translate3d(0, -${currentOffset}px, 0)`;
                updateItemScales(currentOffset);
            }

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                if (onComplete) onComplete();
            }
        };

        animationRef.current = requestAnimationFrame(tick);
    };

    // Helper to update scales based on distance from center
    const updateItemScales = (offset: number) => {
        if (!stripRef.current) return;

        // Strip center position relative to top of strip
        // Viewport center is at 50% of container height.
        // Container height is what? It's "h-full" in parent. Let's assume window height or parent height.
        // The strip is centered vertically in parent with "top: 50%, marginTop: -CARD_HEIGHT/2".
        // Actually, logic:
        // The "Center" of the viewframe corresponds to `offset`.
        // Because we translate(0, -offset).
        // So the item at `offset` is exactly in the middle of the "slot".

        // Iterate all items
        itemsRef.current.forEach((el, index) => {
            if (!el) return;

            // Item center position in the strip
            const itemCenter = index * ITEM_SIZE + CARD_HEIGHT / 2;

            // Current "Visual Center" in the strip coordinates is `offset + CARD_HEIGHT/2`?
            // Wait. We translate strip up by `offset`. 
            // So pixel `offset` of the strip aligns with the top of the view container (or roughly the window center if we ignored the top:50% logic).
            // Let's refine.
            // stripRef style: top: 50%, marginTop: -CARD_HEIGHT/2.
            // visual_center_y = 0 relative to that origin.
            // Effect check: translate is -offset.
            // So the point in the strip at `y = offset` is at local y=0.

            // So we want distance between `index * ITEM_SIZE` (item top) and `offset`.
            // Ideally distance between Item Center and Offset Center.
            // Item Center = index * ITEM_SIZE + CARD_HEIGHT/2.
            // Target Center = offset + CARD_HEIGHT/2.

            const dist = Math.abs(itemCenter - (offset + CARD_HEIGHT / 2));

            // Max distance to affect scale. Say 1.5 items away.
            const maxDist = ITEM_SIZE * 1.5;

            let scale = 0.75; // Default small

            if (dist < maxDist) {
                // Interpolate from 0.75 to 1.0
                // dist 0 -> 1.0
                // dist maxDist -> 0.75
                const ratio = 1 - (dist / maxDist);
                scale = 0.75 + (0.25 * ratio);
            }

            el.style.transform = `scale(${scale})`;
            // Optional: Adjust opacity or blur dynamically too if needed, but scale is the request.
        });
    }

    const hasCalledEndRef = useRef(false);

    // Stable callback ref to prevent Effect restarts
    const onSpinEndRef = useRef(onSpinEnd);
    useEffect(() => {
        onSpinEndRef.current = onSpinEnd;
    }, [onSpinEnd]);

    // --- SPIN LOGIC ---
    useEffect(() => {
        if (spinning && winIndex !== null) {
            setIsSpinning(true);
            hasCalledEndRef.current = false; // Reset lock
            if (animationRef.current) cancelAnimationFrame(animationRef.current); // STOP PREVIOUS

            // REVERSED DIRECTION LOGIC:
            // "Other direction" means items should move UP (Strip moves UP).
            // Start: Low Index (Current) -> End: High Index (Future)

            const LOOP_TARGET = 10; // Target deeply into the list
            const targetIndex = (LOOP_TARGET * prizes.length) + winIndex;
            const targetOffset = targetIndex * ITEM_SIZE;

            // Start from where we roughly are (or a standard reset point)
            const startOffset = (2 * prizes.length) * ITEM_SIZE;

            // Instant Reset to start position (invisible jump if items match)
            if (stripRef.current) {
                stripRef.current.style.transform = `translate3d(0, -${startOffset}px, 0)`;
                updateItemScales(startOffset);
            }

            // Start Animation
            animateScroll(startOffset, targetOffset, 5000, () => {
                if (!hasCalledEndRef.current) {
                    hasCalledEndRef.current = true;
                    setIsSpinning(false);
                    if (onSpinEndRef.current) onSpinEndRef.current();
                }
            });

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning, winIndex, prizes.length, ITEM_SIZE]); // Removed onSpinEnd from deps!

    // Initial Setup
    useEffect(() => {
        if (prizes.length > 0 && stripRef.current) {
            const startIdx = 2 * prizes.length; // Start at 2nd set
            const initialPixelOffset = startIdx * ITEM_SIZE;
            currentOffsetRef.current = initialPixelOffset;
            stripRef.current.style.transform = `translate3d(0, -${initialPixelOffset}px, 0)`;
            updateItemScales(initialPixelOffset);
        }
    }, [prizes.length, ITEM_SIZE]);

    // --- IDLE ANIMATION LOOP ---
    useEffect(() => {
        if (spinning) return;

        const interval = setInterval(() => {
            // "Wind Up" / Hiccup Effect
            const baseOffset = currentOffsetRef.current;
            const windUpOffset = baseOffset - 40;
            const targetOffset = baseOffset + ITEM_SIZE;

            // 1. Wind Up (Fast)
            animateScroll(baseOffset, windUpOffset, 300, () => {
                // 2. Drop (Bounce/Elastic)
                animateScroll(windUpOffset, targetOffset, 600, () => {
                    currentOffsetRef.current = targetOffset;

                    // Reset if too deep (Infinite Scroll Illusion)
                    const limit = (prizes.length * (REPEAT_COUNT - 4)) * ITEM_SIZE;
                    if (currentOffsetRef.current > limit) {
                        const resetOffset = (2 * prizes.length * ITEM_SIZE) + (currentOffsetRef.current % ITEM_SIZE);
                        currentOffsetRef.current = resetOffset;
                        if (stripRef.current) {
                            stripRef.current.style.transform = `translate3d(0, -${resetOffset}px, 0)`;
                            updateItemScales(resetOffset);
                        }
                    }
                });
            });

        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [spinning, prizes.length, ITEM_SIZE]);


    return (
        <div className="w-full h-full relative overflow-hidden flex justify-center transform-gpu">
            {/* Gradient Overlays */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#FF4500] via-[#FF4500]/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#FF6000] via-[#FF6000]/90 to-transparent z-10 pointer-events-none" />

            {/* Spin Indicators (Always Visible now) */}
            {/* Spin Indicators (Show only when spinning) */}
            {spinning && (
                <>
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 animate-pulse">
                        <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-l-[30px] border-l-white drop-shadow-md filter drop-shadow-lg" />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 rotate-180 animate-pulse">
                        <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-l-[30px] border-l-white drop-shadow-md filter drop-shadow-lg" />
                    </div>
                </>
            )}

            {/* Background Pattern */}
            <div
                className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${spinning ? 'opacity-30' : 'opacity-0'}`}
                style={{
                    background: `linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.8) 10%, transparent 20%)`,
                    backgroundSize: '100% 200%'
                }}
            />

            {/* SCROLL STRIP - Controlled by ref (no React State for transform) */}
            <div
                ref={stripRef}
                className="flex flex-col items-center absolute w-full will-change-transform"
                style={{
                    top: '50%',
                    marginTop: -CARD_HEIGHT / 2,
                    // transform is assigned via JS directly
                    gap: GAP,
                    backfaceVisibility: 'hidden',
                    perspective: 1000,
                    transformStyle: 'preserve-3d',
                }}
            >
                {extendedPrizes.map((prize, i) => (
                    <div
                        key={`${prize.id}-${i}`}
                        ref={el => { itemsRef.current[i] = el; }}
                        className="flex-shrink-0 relative transform origin-center flex items-center justify-center"
                        style={{ width: '100%', height: CARD_HEIGHT }}
                    >
                        {/* Prize Image (Priority) */}
                        {prize.image_url ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Glow/Backlight behind image */}
                                <div className="absolute w-32 h-32 bg-white/20 blur-2xl rounded-full" />
                                <img
                                    src={prize.image_url}
                                    alt={prize.name}
                                    className="relative z-10 w-[80%] h-[80%] object-contain drop-shadow-xl"
                                />
                                <div className="absolute bottom-4 z-20 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                    <span className="text-black font-bold text-sm uppercase tracking-wide whitespace-nowrap">
                                        {prize.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Fallback Card Design (Text) */
                            <div className={`
                                w-[85%] h-full rounded-3xl flex items-center justify-between px-8 relative overflow-hidden mx-auto
                                ${i % 2 === 0 ? 'bg-[#ff5500]' : 'bg-[#ff6600]'} 
                                shadow-[0_8px_0_rgba(0,0,0,0.15)] 
                            `}>
                                <div className={`absolute top-[-20%] left-[-10%] w-20 h-20 bg-white/10 rounded-full ${isSpinning ? '' : 'blur-xl'} transition-all duration-300`} />
                                <div className="text-white z-10">
                                    <div className="text-4xl font-black italic drop-shadow-sm">{prize.name}</div>
                                </div>
                                <div className={`w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border border-white/20 shadow-inner z-10`}>
                                    <span className="text-4xl">🎁</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
