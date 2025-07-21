// hooks/useGame.ts
import { useState, useRef, useCallback } from "react"
import { GameObject, Bullet, Enemy, Particle, GameState, CurrentScreen } from "../types/game"
import { createParticles } from "../utils/gameLogic"

export const useGame = () => {
  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>("home")
  const [gameState, setGameState] = useState<GameState>("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [canSubmitScore, setCanSubmitScore] = useState(false)

  // Game objects
  const playerRef = useRef<GameObject>({ x: 400, y: 500, width: 40, height: 40 })
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const particlesRef = useRef<Particle[]>([])
  const keysRef = useRef<Set<string>>(new Set())

  const createParticle = useCallback((x: number, y: number, color: string) => {
    const newParticles = createParticles(x, y, color)
    particlesRef.current.push(...newParticles)
  }, [])

  const startGame = () => {
    setGameState("playing")
    setCurrentScreen("game")
    setScore(0)
    setLives(3)
    setLevel(1)
    setCanSubmitScore(false)
    playerRef.current = { x: 400, y: 500, width: 40, height: 40 }
    bulletsRef.current = []
    enemiesRef.current = []
    particlesRef.current = []
  }

  const pauseGame = () => {
    setGameState(gameState === "paused" ? "playing" : "paused")
  }

  const resetGame = () => {
    setGameState("menu")
    setCurrentScreen("home")
    setScore(0)
    setLives(3)
    setLevel(1)
    setCanSubmitScore(false)
  }

  const goHome = () => {
    setCurrentScreen("home")
    setGameState("menu")
    setCanSubmitScore(false)
  }

  const gameOver = () => {
    setGameState("gameOver")
    setCanSubmitScore(true)
  }

  const addScore = (points: number) => {
    setScore(prev => prev + points)
  }

  const loseLife = () => {
    setLives(prev => {
      const newLives = prev - 1
      if (newLives <= 0) {
        gameOver()
      }
      return newLives
    })
  }

  const checkLevelUp = () => {
    if (score > level * 1000) {
      setLevel(prev => prev + 1)
    }
  }

  return {
    // State
    currentScreen,
    gameState,
    score,
    lives,
    level,
    soundEnabled,
    canSubmitScore,
    
    // Refs
    playerRef,
    bulletsRef,
    enemiesRef,
    particlesRef,
    keysRef,
    
    // Actions
    startGame,
    pauseGame,
    resetGame,
    goHome,
    gameOver,
    addScore,
    loseLife,
    checkLevelUp,
    createParticle,
    setSoundEnabled,
    setCanSubmitScore,
    
    // Setters for external updates
    setCurrentScreen,
    setGameState
  }
}