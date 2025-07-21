"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Volume2, VolumeX, Pause, Play, RotateCcw, Trophy, Crown, Home, Calendar, User } from "lucide-react"
import Image from "next/image"
import { createWalletClient, custom, createPublicClient, http, getContract } from "viem"
import { huddle01Testnet } from "viem/chains"

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  vx?: number
  vy?: number
  color?: string
  type?: string
}

interface Bullet extends GameObject {
  type: "player" | "enemy"
}

interface Enemy extends GameObject {
  health: number
  shootTimer: number
}

interface Particle extends GameObject {
  life: number
  maxLife: number
}

interface LeaderboardEntry {
  address: string
  score: number
  timestamp: number
}

// Smart contract ABI from Remix

// Fix for window.ethereum type error (MetaMask)
declare global {
  interface Window {
    ethereum?: any;
  }
}
const LEADERBOARD_ABI = [
  { "inputs": [], "name": "InvalidInput", "type": "error" },
  { "inputs": [], "name": "NotHigherScore", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint64", "name": "score", "type": "uint64" },
      { "indexed": false, "internalType": "uint32", "name": "level", "type": "uint32" },
      { "indexed": false, "internalType": "uint64", "name": "timestamp", "type": "uint64" }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint64", "name": "_score", "type": "uint64" },
      { "internalType": "uint32", "name": "_level", "type": "uint32" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "start", "type": "uint256" },
      { "internalType": "uint256", "name": "howMany", "type": "uint256" }
    ],
    "name": "getPage",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint64", "name": "score", "type": "uint64" },
          { "internalType": "uint32", "name": "level", "type": "uint32" },
          { "internalType": "uint64", "name": "timestamp", "type": "uint64" }
        ],
        "internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
        "name": "page",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTop20",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint64", "name": "score", "type": "uint64" },
          { "internalType": "uint32", "name": "level", "type": "uint32" },
          { "internalType": "uint64", "name": "timestamp", "type": "uint64" }
        ],
        "internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
        "name": "top",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "leaderboardSize",
    "outputs": [
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_LEADERBOARD_SIZE",
    "outputs": [
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerBest",
    "outputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint64", "name": "score", "type": "uint64" },
      { "internalType": "uint32", "name": "level", "type": "uint32" },
      { "internalType": "uint64", "name": "timestamp", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
const CONTRACT_ADDRESS = "0x2fCA448814b5A10c99dBB3FC99B1EfD342e10a30" as `0x${string}`
export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [currentScreen, setCurrentScreen] = useState<"home" | "game">("home")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"discord" | "wallet" | null>(null)
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Wallet and leaderboard state
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [playerBestScore, setPlayerBestScore] = useState(0)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [canSubmitScore, setCanSubmitScore] = useState(false)

  // Viem clients
  const [walletClient, setWalletClient] = useState<any>(null)
  const [publicClient, setPublicClient] = useState<any>(null)

  // Game objects
  const playerRef = useRef<GameObject>({ x: 400, y: 500, width: 40, height: 40 })
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const particlesRef = useRef<Particle[]>([])
  const keysRef = useRef<Set<string>>(new Set())

  // Check if user is logged in (wallet only)
  useEffect(() => {
    if (walletAddress) {
      setIsLoggedIn(true)
      setLoginMethod("wallet")
    } else {
      setIsLoggedIn(false)
      setLoginMethod(null)
    }
  }, [walletAddress])

  // Initialize Viem clients
  useEffect(() => {
    const initClients = () => {
      const publicClient = createPublicClient({
        chain: huddle01Testnet,
        transport: http(),
      })
      setPublicClient(publicClient)
    }

    initClients()
  }, [])

  // Load leaderboard on component mount
  useEffect(() => {
    if (publicClient) {
      loadLeaderboard()
    }
  }, [publicClient])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to connect your wallet!")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${huddle01Testnet.id.toString(16)}` }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${huddle01Testnet.id.toString(16)}`,
                chainName: huddle01Testnet.name,
                nativeCurrency: huddle01Testnet.nativeCurrency,
                rpcUrls: huddle01Testnet.rpcUrls.default.http,
                blockExplorerUrls: huddle01Testnet.blockExplorers?.default
                  ? [huddle01Testnet.blockExplorers.default.url]
                  : undefined,
              },
            ],
          })
        }
      }

      const walletClient = createWalletClient({
        chain: huddle01Testnet,
        transport: custom(window.ethereum),
      })

      setWalletClient(walletClient)
      setWalletAddress(accounts[0])
      setLoginMethod("wallet")
      setIsLoggedIn(true)

      await loadPlayerBestScore(accounts[0])
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Smart contract interactions
  const loadLeaderboard = async () => {
    if (!publicClient) return

    try {
      // Use Viem's readContract for reading leaderboard
      const topScores = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: LEADERBOARD_ABI,
        functionName: "getTop20",
        args: [],
        gas: BigInt(500000),
      });
      // Map to best score per address
      const scoreMap = new Map<string, LeaderboardEntry>();
      for (const entry of topScores) {
        const addr = entry.player.toLowerCase();
        const score = Number(entry.score);
        if (!scoreMap.has(addr) || score > scoreMap.get(addr)!.score) {
          scoreMap.set(addr, {
            address: entry.player,
            score,
            timestamp: Number(entry.timestamp),
          });
        }
      }
      // Only best score per address
      const formattedScores: LeaderboardEntry[] = Array.from(scoreMap.values());
      setLeaderboard(formattedScores);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
  }

  // Load best score for player using playerBest mapping
  const loadPlayerBestScore = async (address: string) => {
    if (!publicClient) return;
    try {
      // Use Viem's readContract for playerBest mapping
      const bestEntry = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: LEADERBOARD_ABI,
        functionName: "playerBest",
        args: [address as `0x${string}`],
      });
      // bestEntry: [player, score, level, timestamp]
      setPlayerBestScore(Number(bestEntry[1]));
    } catch (error) {
      console.error("Failed to load player best score:", error);
      setPlayerBestScore(0);
    }
  }

  const submitScoreToBlockchain = async () => {
    if (!walletClient || !walletAddress) {
      alert("Please connect your wallet to submit scores!")
      return
    }

    if (score <= playerBestScore) {
      alert("This score is not higher than your current best!")
      return
    }

    setIsSubmittingScore(true);
    try {
      // Use Viem's writeContract for submitting score
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: LEADERBOARD_ABI,
        functionName: "submitScore",
        args: [BigInt(score), Number(level)],
        account: walletAddress as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await loadLeaderboard();
      await loadPlayerBestScore(walletAddress);
      setCanSubmitScore(false);
      alert(`New high score submitted to blockchain! Score: ${score.toLocaleString()}`);
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Failed to submit score to blockchain. Please try again.");
    } finally {
      setIsSubmittingScore(false);
    }
  }

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

  // Game mechanics (keeping existing game logic)
  const spawnEnemy = useCallback(() => {
    const enemy: Enemy = {
      x: Math.random() * 760,
      y: -50,
      width: 30,
      height: 30,
      vy: 1 + Math.random() * 2,
      health: 1,
      shootTimer: 0,
      color: "#ff4444",
    }
    enemiesRef.current.push(enemy)
  }, [])

  const createParticle = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 5; i++) {
      const particle: Particle = {
        x: x + Math.random() * 20 - 10,
        y: y + Math.random() * 20 - 10,
        width: 2,
        height: 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        life: 30,
        maxLife: 30,
      }
      particlesRef.current.push(particle)
    }
  }, [])

  const checkCollision = (obj1: GameObject, obj2: GameObject) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    )
  }

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw stars background
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % canvas.width
      const y = (i * 73 + Date.now() * 0.1) % canvas.height
      ctx.fillRect(x, y, 1, 1)
    }

    // Player movement - Arrow keys and WASD
    const player = playerRef.current
    if ((keysRef.current.has("ArrowLeft") || keysRef.current.has("KeyA")) && player.x > 0) {
      player.x -= 5
    }
    if ((keysRef.current.has("ArrowRight") || keysRef.current.has("KeyD")) && player.x < canvas.width - player.width) {
      player.x += 5
    }
    if ((keysRef.current.has("ArrowUp") || keysRef.current.has("KeyW")) && player.y > 0) {
      player.y -= 5
    }
    if ((keysRef.current.has("ArrowDown") || keysRef.current.has("KeyS")) && player.y < canvas.height - player.height) {
      player.y += 5
    }

    // Player shooting
    if (keysRef.current.has("Space")) {
      if (bulletsRef.current.filter((b) => b.type === "player").length < 5) {
        bulletsRef.current.push({
          x: player.x + player.width / 2 - 2,
          y: player.y,
          width: 4,
          height: 10,
          vy: -8,
          type: "player",
          color: "#00ff00",
        })
      }
    }

    // Draw player (starship)
    ctx.fillStyle = "#4444ff"
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.fillStyle = "#6666ff"
    ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, player.height - 10)
    // Engine glow
    ctx.fillStyle = "#ffaa00"
    ctx.fillRect(player.x + 15, player.y + player.height, 10, 8)

    // Spawn enemies
    if (Math.random() < 0.02 + level * 0.005) {
      spawnEnemy()
    }

    // Update and draw enemies (bugs)
    enemiesRef.current = enemiesRef.current.filter((enemy) => {
      enemy.y += enemy.vy || 1

      // Enemy shooting
      enemy.shootTimer++
      if (enemy.shootTimer > 60 && Math.random() < 0.01) {
        bulletsRef.current.push({
          x: enemy.x + enemy.width / 2 - 2,
          y: enemy.y + enemy.height,
          width: 4,
          height: 8,
          vy: 4,
          type: "enemy",
          color: "#ff4444",
        })
        enemy.shootTimer = 0
      }

      // Draw enemy (bug-like)
      ctx.fillStyle = enemy.color || "#ff4444"
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
      ctx.fillStyle = "#ff6666"
      ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10)
      // Bug legs
      ctx.fillStyle = "#aa2222"
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
      particle.x += particle.vx || 0
      particle.y += particle.vy || 0
      particle.life--

      const alpha = particle.life / particle.maxLife
      ctx.fillStyle = particle.color || "#ffffff"
      ctx.globalAlpha = alpha
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height)
      ctx.globalAlpha = 1

      return particle.life > 0
    })

    // Collision detection
    bulletsRef.current.forEach((bullet, bulletIndex) => {
      if (bullet.type === "player") {
        enemiesRef.current.forEach((enemy, enemyIndex) => {
          if (checkCollision(bullet, enemy)) {
            createParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ff4444")
            enemiesRef.current.splice(enemyIndex, 1)
            bulletsRef.current.splice(bulletIndex, 1)
            setScore((prev) => prev + 100)
          }
        })
      } else if (bullet.type === "enemy") {
        if (checkCollision(bullet, player)) {
          createParticle(player.x + player.width / 2, player.y + player.height / 2, "#4444ff")
          bulletsRef.current.splice(bulletIndex, 1)
          setLives((prev) => {
            const newLives = prev - 1
            if (newLives <= 0) {
              setGameState("gameOver")
              setCanSubmitScore(true)
            }
            return newLives
          })
        }
      }
    })

    // Enemy collision with player
    enemiesRef.current.forEach((enemy, enemyIndex) => {
      if (checkCollision(enemy, player)) {
        createParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ff4444")
        createParticle(player.x + player.width / 2, player.y + player.height / 2, "#4444ff")
        enemiesRef.current.splice(enemyIndex, 1)
        setLives((prev) => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState("gameOver")
            setCanSubmitScore(true)
          }
          return newLives
        })
      }
    })

    // Level progression
    if (score > level * 1000) {
      setLevel((prev) => prev + 1)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, level, spawnEnemy, createParticle])

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

  // Game loop
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

  // Home Screen
  if (!isLoggedIn || currentScreen === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fillOpacity=&quot;0.03&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <Image
              src="/huddle01-logo.png"
              alt="HUDDLE01"
              width={200}
              height={60}
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-5xl font-bold text-white mb-2 font-mono">STARSHIP TROOPERS</h1>
            <p className="text-xl text-blue-200 font-mono">MOBILE INFANTRY SPACE SHOOTER</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login/Game Section */}
            <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white font-mono">
                  {isLoggedIn ? "MISSION CONTROL" : "AUTHENTICATION"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {!isLoggedIn ? (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-sm text-slate-300 mb-4 font-mono">CONNECT YOUR WALLET TO CONTINUE</p>
                    </div>

                    <Button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white h-12 font-mono"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
                    </Button>

                    <div className="text-center pt-4">
                      <p className="text-xs text-slate-400 font-mono">WALLET REQUIRED FOR LEADERBOARD</p>
                      <p className="text-xs text-slate-400 font-mono">SERVICE GUARANTEES CITIZENSHIP</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="space-y-2">
                        <Badge className="bg-green-600 text-white font-mono">
                          <Wallet className="w-3 h-3 mr-1" />
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </Badge>
                        {playerBestScore > 0 && (
                          <div className="mt-2">
                            <Badge className="bg-yellow-600 text-white font-mono">
                              <Trophy className="w-3 h-3 mr-1" />
                              BEST: {playerBestScore.toLocaleString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button onClick={startGame} className="w-full bg-red-600 hover:bg-red-700 font-mono text-lg h-14">
                      <Play className="mr-2 h-6 w-6" />
                      START MISSION
                    </Button>

                    <Button
                      onClick={() => {
                        setWalletAddress("");
                        setIsLoggedIn(false);
                        setLoginMethod(null);
                        setLeaderboard([]);
                        setPlayerBestScore(0);
                      }}
                      className="w-full mt-4 bg-gray-700 hover:bg-gray-800 text-white font-mono h-12"
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      DISCONNECT WALLET
                    </Button>

                    <div className="mt-6 text-center text-sm text-slate-300 font-mono">
                      <p>ARROW KEYS OR WASD: MOVE</p>
                      <p>SPACEBAR: SHOOT</p>
                      <p>ELIMINATE ALL BUGS!</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Section */}
            <Card className="bg-slate-800/90 border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                  GLOBAL LEADERBOARD
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-400 font-mono text-sm">
                    <p>NO SCORES YET</p>
                    <p>BE THE FIRST TROOPER!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {leaderboard
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 20)
                      .map((entry, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            entry.address.toLowerCase() === walletAddress.toLowerCase()
                              ? "bg-yellow-900/30 border border-yellow-500/30"
                              : "bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm">
                              {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                            </div>
                            <div>
                              <p className="text-white font-mono text-sm">
                                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(entry.timestamp * 1000).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-mono text-sm font-bold">{entry.score.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Game Screen (keeping existing game screen logic)
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-6xl mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={goHome} variant="outline" size="sm" className="font-mono">
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
            onClick={() => setSoundEnabled(!soundEnabled)}
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
                <Button onClick={pauseGame} variant="outline" size="sm" className="font-mono bg-blue-500" color="blue">
                  <Pause className="h-4 w-4 mr-1 text-white" />
                  PAUSE
                </Button>
              )}
              {gameState === "paused" && (
                <Button onClick={pauseGame} variant="outline" size="sm" className="font-mono bg-blue-500" color="blue">
                  <Play className="h-4 w-4 mr-1 text-white" />
                  RESUME
                </Button>
              )}
              <Button onClick={resetGame} variant="outline" size="sm" className="font-mono bg-blue-500">
                <RotateCcw className="h-4 w-4 mr-1 text-white" />
                RESET
              </Button>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative border-2 border-blue-500">
            <canvas ref={canvasRef} width={800} height={600} className="bg-black" />

            {/* Game State Overlays */}
            {gameState === "menu" && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white font-mono">
                  <h2 className="text-4xl mb-4">STARSHIP TROOPERS</h2>
                  <p className="text-xl mb-8">SPACE SHOOTER</p>
                  <Button onClick={startGame} className="bg-red-600 hover:bg-red-700 font-mono text-lg px-8 py-3">
                    START MISSION
                  </Button>
                  <div className="mt-8 text-sm text-slate-300">
                    <p>ARROW KEYS OR WASD: MOVE</p>
                    <p>SPACEBAR: SHOOT</p>
                    <p>ELIMINATE ALL BUGS!</p>
                  </div>
                </div>
              </div>
            )}

            {gameState === "paused" && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white font-mono">
                  <h2 className="text-4xl mb-4">MISSION PAUSED</h2>
                  <Button onClick={pauseGame} className="bg-blue-600 hover:bg-blue-700 font-mono text-lg px-8 py-3">
                    RESUME MISSION
                  </Button>
                </div>
              </div>
            )}

            {gameState === "gameOver" && (
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
                        onClick={async () => {
                          await submitScoreToBlockchain();
                          // After submitting, reload best score to ensure UI is correct
                          await loadPlayerBestScore(walletAddress);
                        }}
                        disabled={isSubmittingScore || !walletAddress}
                        className="bg-yellow-600 hover:bg-yellow-700 font-mono text-lg px-8 py-3 mr-4"
                      >
                        <Trophy className="mr-2 h-5 w-5" />
                        {isSubmittingScore ? "SUBMITTING..." : "SUBMIT TO LEADERBOARD"}
                      </Button>
                    </div>
                  )}

                  {/* If not a new high score, do not show the message or button */}

                  <div className="space-x-4">
                    <Button onClick={startGame} className="bg-red-600 hover:bg-red-700 font-mono text-lg px-8 py-3">
                      RETRY MISSION
                    </Button>
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="font-mono text-lg px-8 py-3 bg-transparent"
                    >
                      MAIN MENU
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-slate-400 font-mono text-sm">
            <p>CONTROLS: WASD/ARROWS = MOVE • SPACEBAR = SHOOT • MOBILE INFANTRY DEPLOYED</p>
          </div>
        </div>

        {/* Mini Leaderboard Sidebar */}
        <div className="w-80">
          <Card className="bg-slate-800/50 border-blue-500/30 h-full">
            <CardHeader>
              <CardTitle className="text-white font-mono flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                TOP TROOPERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center text-slate-400 font-mono text-sm">
                  <p>NO SCORES YET</p>
                  <p>BE THE FIRST!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.address.toLowerCase() === walletAddress.toLowerCase()
                          ? "bg-yellow-900/30 border border-yellow-500/30"
                          : "bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm">
                          {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                        </div>
                        <p className="text-white font-mono text-sm">
                          {`${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                        </p>
                        {/* Removed level from leaderboard entry */}
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-mono text-sm">{entry.score.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
