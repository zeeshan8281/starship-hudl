// components/StarshipTroopers.tsx
"use client"

import { useState, useEffect } from "react"
import { useWallet } from "../hooks/useWallet"
import { useGame } from "../hooks/useGame"
import { useLeaderboard } from "../hooks/useLeaderboard"
import HomeScreen from "./HomeScreen"
import GameScreen from "./GameScreen"
import { LoginMethod } from "../types/game"

export default function StarshipTroopers() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null)

  // Custom hooks
  const {
    walletAddress,
    isConnecting,
    walletClient,
    publicClient,
    connectWallet,
    disconnectWallet,
    isConnected
  } = useWallet()

  const {
    currentScreen,
    gameState,
    score,
    lives,
    level,
    soundEnabled,
    canSubmitScore,
    playerRef,
    bulletsRef,
    enemiesRef,
    particlesRef,
    keysRef,
    startGame,
    pauseGame,
    resetGame,
    goHome,
    addScore,
    loseLife,
    checkLevelUp,
    createParticle,
    setSoundEnabled,
    setCanSubmitScore
  } = useGame()

  const {
    leaderboard,
    playerBestScore,
    isSubmittingScore,
    loadLeaderboard,
    loadPlayerBestScore,
    submitScoreToBlockchain
  } = useLeaderboard(publicClient, walletClient, walletAddress)

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

  // Enhanced wallet connection handler
  const handleConnectWallet = async () => {
    await connectWallet()
    if (walletAddress) {
      await loadPlayerBestScore(walletAddress)
    }
  }

  // Enhanced wallet disconnection handler
  const handleDisconnectWallet = () => {
    disconnectWallet()
    setIsLoggedIn(false)
    setLoginMethod(null)
  }

  // Enhanced score submission handler
  const handleSubmitScore = async () => {
    const success = await submitScoreToBlockchain(score, level)
    if (success) {
      setCanSubmitScore(false)
      // Reload player best score to ensure UI is correct
      await loadPlayerBestScore(walletAddress)
    }
  }

  // Show home screen if not logged in or on home screen
  if (!isLoggedIn || currentScreen === "home") {
    return (
      <HomeScreen
        isLoggedIn={isLoggedIn}
        isConnecting={isConnecting}
        walletAddress={walletAddress}
        playerBestScore={playerBestScore}
        leaderboard={leaderboard}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onStartGame={startGame}
      />
    )
  }

  // Show game screen
  return (
    <GameScreen
      gameState={gameState}
      score={score}
      lives={lives}
      level={level}
      soundEnabled={soundEnabled}
      canSubmitScore={canSubmitScore}
      isSubmittingScore={isSubmittingScore}
      walletAddress={walletAddress}
      playerBestScore={playerBestScore}
      leaderboard={leaderboard}
      playerRef={playerRef}
      bulletsRef={bulletsRef}
      enemiesRef={enemiesRef}
      particlesRef={particlesRef}
      keysRef={keysRef}
      onGoHome={goHome}
      onStartGame={startGame}
      onPauseGame={pauseGame}
      onResetGame={resetGame}
      onToggleSound={() => setSoundEnabled(!soundEnabled)}
      onAddScore={addScore}
      onLoseLife={loseLife}
      onCheckLevelUp={checkLevelUp}
      onCreateParticle={createParticle}
      onSubmitScore={handleSubmitScore}
    />
  )
}