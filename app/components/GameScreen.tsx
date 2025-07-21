// components/GameScreen.tsx
"use client"

import { MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Volume2, VolumeX, Trophy } from "lucide-react"
import Image from "next/image"
import GameHUD from "./GameHUD"
import GameCanvas from "./GameCanvas"
import GameOverlay from "./GameOverlay"
import MiniLeaderboard from "./MiniLeaderboard"
import { GameObject, Bullet, Enemy, Particle, GameState, LeaderboardEntry } from "../types/game"

interface GameScreenProps {
  // Game state
  gameState: GameState
  score: number
  lives: number
  level: number
  soundEnabled: boolean
  canSubmitScore: boolean
  isSubmittingScore: boolean
  
  // User data
  walletAddress: string
  playerBestScore: number
  leaderboard: LeaderboardEntry[]
  
  // Game refs
  playerRef: MutableRefObject<GameObject>
  bulletsRef: MutableRefObject<Bullet[]>
  enemiesRef: MutableRefObject<Enemy[]>
  particlesRef: MutableRefObject<Particle[]>
  keysRef: MutableRefObject<Set<string>>
  
  // Event handlers
  onGoHome: () => void
  onStartGame: () => void
  onPauseGame: () => void
  onResetGame: () => void
  onToggleSound: () => void
  onAddScore: (points: number) => void
  onLoseLife: () => void
  onCheckLevelUp: () => void
  onCreateParticle: (x: number, y: number, color: string) => void
  onSubmitScore: () => Promise<void>
}

export default function GameScreen({
  gameState,
  score,
  lives,
  level,
  soundEnabled,
  canSubmitScore,
  isSubmittingScore,
  walletAddress,
  playerBestScore,
  leaderboard,
  playerRef,
  bulletsRef,
  enemiesRef,
  particlesRef,
  keysRef,
  onGoHome,
  onStartGame,
  onPauseGame,
  onResetGame,
  onToggleSound,
  onAddScore,
  onLoseLife,
  onCheckLevelUp,
  onCreateParticle,
  onSubmitScore
}: GameScreenProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-6xl mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onGoHome} variant="outline" size="sm" className="font-mono">
            <Home className="h-4 w-4 mr-1 text-blue-500" />
            HOME
          </Button>
          <Image src="/huddle01-logo.png" alt="HUDDLE01" width={120} height={36} className="h-8 w-auto" />
          <Badge variant="outline" className="border-blue-400 text-blue-300 font-mono">
            MOBILE INFANTRY
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <Badge className="bg-green-600 text-white font-mono">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "TROOPER ALPHA-7"}
          </Badge>
          {walletAddress && playerBestScore > 0 && (
            <Badge className="bg-yellow-600 text-white font-mono">
              <Trophy className="w-3 h-3 mr-1" />
              BEST: {playerBestScore.toLocaleString()}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            className="text-blue-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-white bg-blue-600 hover:bg-blue-700 font-mono rounded-md px-3 py-1"
            onClick={() => window.open('https://testnet.huddle01.com/', '_blank')}
          >
            POWERED BY THE Huddle01 Testnet!
          </Button>
        </div>
      </div>

      <div className="w-full max-w-6xl flex gap-6">
        {/* Game Area */}
        <div className="flex-1">
          {/* Game HUD */}
          <GameHUD 
            score={score}
            lives={lives}
            level={level}
            gameState={gameState}
            onPause={onPauseGame}
            onReset={onResetGame}
          />

          {/* Game Canvas with Overlays */}
          <div className="relative">
            <GameCanvas 
              gameState={gameState}
              level={level}
              playerRef={playerRef}
              bulletsRef={bulletsRef}
              enemiesRef={enemiesRef}
              particlesRef={particlesRef}
              keysRef={keysRef}
              onAddScore={onAddScore}
              onLoseLife={onLoseLife}
              onCheckLevelUp={onCheckLevelUp}
              onCreateParticle={onCreateParticle}
            />
            
            <GameOverlay 
              gameState={gameState}
              score={score}
              level={level}
              canSubmitScore={canSubmitScore}
              isSubmittingScore={isSubmittingScore}
              playerBestScore={playerBestScore}
              walletAddress={walletAddress}
              onStart={onStartGame}
              onPause={onPauseGame}
              onReset={onResetGame}
              onSubmitScore={onSubmitScore}
            />
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-slate-400 font-mono text-sm">
            <p>CONTROLS: WASD/ARROWS = MOVE • SPACEBAR = SHOOT • MOBILE INFANTRY DEPLOYED</p>
          </div>
        </div>

        {/* Mini Leaderboard Sidebar */}
        <div className="w-80">
          <MiniLeaderboard 
            leaderboard={leaderboard} 
            currentUserAddress={walletAddress} 
          />
        </div>
      </div>
    </div>
  )
}