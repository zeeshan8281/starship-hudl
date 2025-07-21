// types/game.ts (Updated for optimized contract integration)
export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  vx?: number
  vy?: number
  color?: string
  type?: string
}

export interface Bullet extends GameObject {
  type: "player" | "enemy"
}

export interface Enemy extends GameObject {
  health: number
  shootTimer: number
}

export interface Particle extends GameObject {
  life: number
  maxLife: number
}

export interface LeaderboardEntry {
  address: string
  score: number
  timestamp: number
  level?: number
}

// Contract's EffectiveScoreEntry struct
export interface EffectiveScoreEntry {
  player: string
  rawScore: number
  effectiveScore: number
  level: number
  timestamp: number
  referralCount: number
}

export interface PlayerStats {
  bestScore: number
  totalSubmissions: number
  referralCount: number
  effectiveScore: number
}

export interface GameStats {
  highScore: number
  champion: string
  totalSubmissions: number
  uniquePlayers: number
  averageTopScore: number
}

export type GameState = "menu" | "playing" | "paused" | "gameOver"
export type CurrentScreen = "home" | "game"
export type LoginMethod = "discord" | "wallet" | null