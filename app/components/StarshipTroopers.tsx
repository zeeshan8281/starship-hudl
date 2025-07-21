// components/StarshipTroopers.tsx (Updated with referral system)
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
  const [referrerAddress, setReferrerAddress] = useState<string>("")

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
    playerStats,
    gameStats,
    isSubmittingScore,
    referralCode,
    loadLeaderboard,
    loadPlayerStats,
    loadGameStats,
    submitScoreToBlockchain,
    parseReferralCode
  } = useLeaderboard(publicClient, walletClient, walletAddress)

  // Parse referral code from URL on component mount
  useEffect(() => {
    const referral = parseReferralCode()
    if (referral) {
      setReferrerAddress(referral)
      console.log("Referral code detected:", referral)
    }
  }, [])

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
      await loadPlayerStats(walletAddress)
      await loadGameStats()
    }
  }

  // Enhanced wallet disconnection handler
  const handleDisconnectWallet = () => {
    disconnectWallet()
    setIsLoggedIn(false)
    setLoginMethod(null)
  }

  // Enhanced score submission handler with referral support
  const handleSubmitScore = async () => {
    const success = await submitScoreToBlockchain(score, level, referrerAddress)
    if (success) {
      setCanSubmitScore(false)
      // Reload player stats to ensure UI is correct
      await Promise.all([
        loadPlayerStats(walletAddress),
        loadGameStats(),
        loadLeaderboard()
      ])
      
      // Clear referrer after first successful submission
      if (referrerAddress) {
        setReferrerAddress("")
        // Update URL to remove referral parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('ref')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }

  // Handle referral link copying
  const handleCopyReferralLink = () => {
    // You can add analytics or notifications here
    console.log("Referral link copied!")
  }

  // Show home screen if not logged in or on home screen
  if (!isLoggedIn || currentScreen === "home") {
    return (
      <HomeScreen
        isLoggedIn={isLoggedIn}
        isConnecting={isConnecting}
        walletAddress={walletAddress}
        playerStats={playerStats}
        gameStats={gameStats}
        leaderboard={leaderboard}
        referralCode={referralCode}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onStartGame={startGame}
        onCopyReferralLink={handleCopyReferralLink}
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
      playerStats={playerStats}
      gameStats={gameStats}
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