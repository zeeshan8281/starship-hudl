// components/GameHUD.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Pause, Play, RotateCcw } from "lucide-react"
import { GameState } from "../_types/game"

interface GameHUDProps {
  score: number
  lives: number
  level: number
  gameState: GameState
  onPause: () => void
  onReset: () => void
}

export default function GameHUD({ score, lives, level, gameState, onPause, onReset }: GameHUDProps) {
  return (
    <div className="mb-4 flex justify-between items-center">
      <div className="flex space-x-6 font-mono text-white">
        <div>
          SCORE: <span className="text-green-400">{score.toLocaleString()}</span>
        </div>
        <div>
          LIVES: <span className="text-red-400">{"♥".repeat(lives)}</span>
        </div>
        <div>
          LEVEL: <span className="text-blue-400">{level}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        {gameState === "playing" && (
          <Button onClick={onPause} variant="outline" size="sm" className="font-mono bg-blue-500" color="blue">
            <Pause className="h-4 w-4 mr-1 text-white" />
            PAUSE
          </Button>
        )}
        {gameState === "paused" && (
          <Button onClick={onPause} variant="outline" size="sm" className="font-mono bg-blue-500" color="blue">
            <Play className="h-4 w-4 mr-1 text-white" />
            RESUME
          </Button>
        )}
        <Button onClick={onReset} variant="outline" size="sm" className="font-mono bg-blue-500">
          <RotateCcw className="h-4 w-4 mr-1 text-white" />
          RESET
        </Button>
      </div>
    </div>
  )
}