// hooks/useGameLoop.ts
import { useEffect, useRef, useCallback, MutableRefObject } from "react"
import { GameObject, Bullet, Enemy, Particle, GameState } from "../types/game"
import { checkCollision, createEnemy, drawStars, updateParticle } from "../utils/gameLogic"
import { GAME_CONFIG, COLORS } from "../utils/constants"

interface UseGameLoopProps {
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

export const useGameLoop = ({
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
}: UseGameLoopProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = COLORS.BACKGROUND
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw stars background
    drawStars(ctx, canvas)

    // Player movement - Arrow keys and WASD
    const player = playerRef.current
    if ((keysRef.current.has("ArrowLeft") || keysRef.current.has("KeyA")) && player.x > 0) {
      player.x -= GAME_CONFIG.PLAYER_SPEED
    }
    if ((keysRef.current.has("ArrowRight") || keysRef.current.has("KeyD")) && player.x < canvas.width - player.width) {
      player.x += GAME_CONFIG.PLAYER_SPEED
    }
    if ((keysRef.current.has("ArrowUp") || keysRef.current.has("KeyW")) && player.y > 0) {
      player.y -= GAME_CONFIG.PLAYER_SPEED
    }
    if ((keysRef.current.has("ArrowDown") || keysRef.current.has("KeyS")) && player.y < canvas.height - player.height) {
      player.y += GAME_CONFIG.PLAYER_SPEED
    }

    // Player shooting
    if (keysRef.current.has("Space")) {
      if (bulletsRef.current.filter((b) => b.type === "player").length < GAME_CONFIG.MAX_PLAYER_BULLETS) {
        bulletsRef.current.push({
          x: player.x + player.width / 2 - 2,
          y: player.y,
          width: 4,
          height: 10,
          vy: -GAME_CONFIG.BULLET_SPEED,
          type: "player",
          color: COLORS.PLAYER_BULLET,
        })
      }
    }

    // Draw player (starship)
    ctx.fillStyle = COLORS.PLAYER
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.fillStyle = COLORS.PLAYER_ACCENT
    ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, player.height - 10)
    // Engine glow
    ctx.fillStyle = COLORS.ENGINE_GLOW
    ctx.fillRect(player.x + 15, player.y + player.height, 10, 8)

    // Spawn enemies
    if (Math.random() < GAME_CONFIG.ENEMY_SPAWN_RATE + level * 0.005) {
      enemiesRef.current.push(createEnemy())
    }

    // Update and draw enemies (bugs)
    enemiesRef.current = enemiesRef.current.filter((enemy) => {
      enemy.y += enemy.vy || 1

      // Enemy shooting
      enemy.shootTimer++
      if (enemy.shootTimer > 60 && Math.random() < GAME_CONFIG.ENEMY_SHOOT_CHANCE) {
        bulletsRef.current.push({
          x: enemy.x + enemy.width / 2 - 2,
          y: enemy.y + enemy.height,
          width: 4,
          height: 8,
          vy: GAME_CONFIG.ENEMY_BULLET_SPEED,
          type: "enemy",
          color: COLORS.ENEMY_BULLET,
        })
        enemy.shootTimer = 0
      }

      // Draw enemy (bug-like)
      ctx.fillStyle = enemy.color || COLORS.ENEMY
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
      ctx.fillStyle = COLORS.ENEMY_ACCENT
      ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10)
      // Bug legs
      ctx.fillStyle = COLORS.ENEMY_LEGS
      ctx.fillRect(enemy.x - 2, enemy.y + 10, 4, 2)
      ctx.fillRect(enemy.x + enemy.width - 2, enemy.y + 10, 4, 2)

      return enemy.y < canvas.height + 50
    })

    // Update and draw bullets
    bulletsRef.current = bulletsRef.current.filter((bullet) => {
      bullet.y += bullet.vy || 0

      ctx.fillStyle = bullet.color || "#ffffff"
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)

      return bullet.y > -20 && bullet.y < canvas.height + 20
    })

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      const shouldKeep = updateParticle(particle)
      
      const alpha = particle.life / particle.maxLife
      ctx.fillStyle = particle.color || "#ffffff"
      ctx.globalAlpha = alpha
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height)
      ctx.globalAlpha = 1

      return shouldKeep
    })

    // Collision detection
    bulletsRef.current.forEach((bullet, bulletIndex) => {
      if (bullet.type === "player") {
        enemiesRef.current.forEach((enemy, enemyIndex) => {
          if (checkCollision(bullet, enemy)) {
            onCreateParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, COLORS.ENEMY)
            enemiesRef.current.splice(enemyIndex, 1)
            bulletsRef.current.splice(bulletIndex, 1)
            onAddScore(100)
          }
        })
      } else if (bullet.type === "enemy") {
        if (checkCollision(bullet, player)) {
          onCreateParticle(player.x + player.width / 2, player.y + player.height / 2, COLORS.PLAYER)
          bulletsRef.current.splice(bulletIndex, 1)
          onLoseLife()
        }
      }
    })

    // Enemy collision with player
    enemiesRef.current.forEach((enemy, enemyIndex) => {
      if (checkCollision(enemy, player)) {
        onCreateParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, COLORS.ENEMY)
        onCreateParticle(player.x + player.width / 2, player.y + player.height / 2, COLORS.PLAYER)
        enemiesRef.current.splice(enemyIndex, 1)
        onLoseLife()
      }
    })

    // Level progression
    onCheckLevelUp()

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, level, onAddScore, onLoseLife, onCheckLevelUp, onCreateParticle])

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code)
      if (e.code === "Space") {
        e.preventDefault()
      }
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Game loop management
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  return { canvasRef }
}