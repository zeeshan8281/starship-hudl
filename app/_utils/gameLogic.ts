// utils/gameLogic.ts
import { GameObject, Enemy, Particle } from '../_types/game'
import { GAME_CONFIG } from './constants'

export const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  )
}

export const createEnemy = (): Enemy => ({
  x: Math.random() * 760,
  y: -50,
  width: 30,
  height: 30,
  vy: 1 + Math.random() * 2,
  health: 1,
  shootTimer: 0,
  color: "#ff4444",
})

export const createParticles = (x: number, y: number, color: string): Particle[] => {
  const particles: Particle[] = []
  
  for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
    particles.push({
      x: x + Math.random() * 20 - 10,
      y: y + Math.random() * 20 - 10,
      width: 2,
      height: 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color,
      life: GAME_CONFIG.PARTICLE_LIFE,
      maxLife: GAME_CONFIG.PARTICLE_LIFE,
    })
  }
  
  return particles
}

export const updateParticle = (particle: Particle): boolean => {
  particle.x += particle.vx || 0
  particle.y += particle.vy || 0
  particle.life--
  
  return particle.life > 0
}

export const drawStars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = "#ffffff"
  for (let i = 0; i < GAME_CONFIG.STARS_COUNT; i++) {
    const x = (i * 37) % canvas.width
    const y = (i * 73 + Date.now() * 0.1) % canvas.height
    ctx.fillRect(x, y, 1, 1)
  }
}