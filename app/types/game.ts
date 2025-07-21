// types/game.ts
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
  }
  
  export type GameState = "menu" | "playing" | "paused" | "gameOver"
  export type CurrentScreen = "home" | "game"
  export type LoginMethod = "discord" | "wallet" | null