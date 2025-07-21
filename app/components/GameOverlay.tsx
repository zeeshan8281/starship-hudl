// components/GameOverlay.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { GameState } from "../types/game"

interface GameOverlayProps {
  gameState: GameState
  score: number
  level: number
  canSubmitScore: boolean
  isSubmittingScore: boolean
  playerBestScore: number
  walletAddress: string
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSubmitScore: () => Promise<void>
}

export default function GameOverlay({
  gameState,
  score,
  level,
  canSubmitScore,
  isSubmittingScore,
  playerBestScore,
  walletAddress,
  onStart,
  onPause,
  onReset,
  onSubmitScore
}: GameOverlayProps) {
  if (gameState === "menu") {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
        <div className="text-center text-white font-mono">
          <h2 className="text-4xl mb-4">STARSHIP TROOPERS</h2>
          <p className="text-xl mb-8">SPACE SHOOTER</p>
          <Button onClick={onStart} className="bg-red-600 hover:bg-red-700 font-mono text-lg px-8 py-3">
            START MISSION
          </Button>
          <div className="mt-8 text-sm text-slate-300">
            <p>ARROW KEYS OR WASD: MOVE</p>
            <p>SPACEBAR: SHOOT</p>
            <p>ELIMINATE ALL BUGS!</p>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "paused") {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
        <div className="text-center text-white font-mono">
          <h2 className="text-4xl mb-4">MISSION PAUSED</h2>
          <Button onClick={onPause} className="bg-blue-600 hover:bg-blue-700 font-mono text-lg px-8 py-3">
            RESUME MISSION
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === "gameOver") {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
        <div className="text-center text-white font-mono">
          <h2 className="text-4xl mb-4 text-red-400">MISSION FAILED</h2>
          <p className="text-xl mb-2">FINAL SCORE: {score.toLocaleString()}</p>
          <p className="text-lg mb-4">LEVEL REACHED: {level}</p>

          {/* Only show NEW HIGH SCORE if score is strictly greater than playerBestScore */}
          {canSubmitScore && score > playerBestScore && (
            <div className="mb-6">
              <p className="text-green-400 mb-4 text-lg">NEW HIGH SCORE!</p>
              <Button
                onClick={onSubmitScore}
                disabled={isSubmittingScore || !walletAddress}
                className="bg-yellow-600 hover:bg-yellow-700 font-mono text-lg px-8 py-3 mr-4"
              >
                <Trophy className="mr-2 h-5 w-5" />
                {isSubmittingScore ? "SUBMITTING..." : "SUBMIT TO LEADERBOARD"}
              </Button>
            </div>
          )}

          <div className="space-x-4">
            <Button onClick={onStart} className="bg-red-600 hover:bg-red-700 font-mono text-lg px-8 py-3">
              RETRY MISSION
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="font-mono text-lg px-8 py-3 bg-transparent"
            >
              MAIN MENU
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}