// components/GameCanvas.tsx
"use client"

import { MutableRefObject } from "react"
import { useGameLoop } from "../hooks/useGameLoop"
import { GameObject, Bullet, Enemy, Particle, GameState } from "../types/game"
import { GAME_CONFIG } from "../utils/constants"

interface GameCanvasProps {
  gameState: GameState
  level: number
  playerRef: MutableRefObject<GameObject>
  bulletsRef: MutableRefObject<Bullet[]>
  enemiesRef: MutableRefObject<Enemy[]>
  particlesRef: MutableRefObject<Particle[]>
  keysRef: MutableRefObject<Set<string>>
  onAddScore: (points: number) => void
  onLoseLife: () => void
  onCheckLevelUp: () => void
  onCreateParticle: (x: number, y: number, color: string) => void
}

export default function GameCanvas({
  gameState,
  level,
  playerRef,
  bulletsRef,
  enemiesRef,
  particlesRef,
  keysRef,
  onAddScore,
  onLoseLife,
  onCheckLevelUp,
  onCreateParticle
}: GameCanvasProps) {
  const { canvasRef } = useGameLoop({
    gameState,
    level,
    playerRef,
    bulletsRef,
    enemiesRef,
    particlesRef,
    keysRef,
    onAddScore,
    onLoseLife,
    onCheckLevelUp,
    onCreateParticle
  })

  return (
    <div className="relative border-2 border-blue-500">
      <canvas 
        ref={canvasRef} 
        width={GAME_CONFIG.CANVAS_WIDTH} 
        height={GAME_CONFIG.CANVAS_HEIGHT} 
        className="bg-black" 
      />
    </div>
  )
}