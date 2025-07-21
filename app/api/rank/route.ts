import { ABI } from "../../utils/abi"
import { CONTRACT_ADDRESS } from "@/app/utils/constants"
import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { huddle01Testnet } from "viem/chains"

// Interface matching the contract's EffectiveScoreEntry struct
interface EffectiveScoreEntry {
  player: string
  rawScore: number
  effectiveScore: number
  level: number
  timestamp: number
  referralCount: number
}

// Interface for player stats
interface PlayerStats {
  bestScore: number
  totalSubmissions: number
  referralCount: number
  effectiveScore: number
}

// Initialize public client
const publicClient = createPublicClient({
  chain: huddle01Testnet,
  transport: http(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("address")

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Validate address format (basic check)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    // Fetch top 20 scores using the contract's getTop20() function
    const topScores = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getTop20",
      args: [],
    })

    console.log("Top 20 scores from contract:", topScores)

    // Convert the contract response to our interface
    const leaderboard: EffectiveScoreEntry[] = topScores.map((entry: any, index: number) => ({
      player: entry.player.toLowerCase(),
      rawScore: Number(entry.rawScore),
      effectiveScore: Number(entry.effectiveScore),
      level: Number(entry.level),
      timestamp: Number(entry.timestamp),
      referralCount: Number(entry.referralCount),
    }))

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    // Find the rank of the requested wallet address
    const normalizedAddress = walletAddress.toLowerCase()
    const playerEntry = leaderboardWithRanks.find((entry) => entry.player === normalizedAddress)

    if (!playerEntry) {
      // Check if player has any score but not in top 20
      try {
        // Get comprehensive player stats using getMyStats
        const playerStats = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "getMyStats",
          args: [walletAddress as `0x${string}`],
        })

        const [bestScore, totalSubmissions, referralCount] = playerStats

        if (Number(bestScore) > 0) {
          // Player has scores but not in top 20 - get their actual rank
          const playerRank = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "getPlayerRank",
            args: [walletAddress as `0x${string}`],
          })

          // Get effective score
          const effectiveScore = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "getEffectiveScore",
            args: [walletAddress as `0x${string}`],
          })

          const playerStatsFormatted: PlayerStats = {
            bestScore: Number(bestScore),
            totalSubmissions: Number(totalSubmissions),
            referralCount: Number(referralCount),
            effectiveScore: Number(effectiveScore)
          }

          return NextResponse.json({
            found: true,
            inTop20: false,
            rank: Number(playerRank),
            rawScore: playerStatsFormatted.bestScore,
            effectiveScore: playerStatsFormatted.effectiveScore,
            referralCount: playerStatsFormatted.referralCount,
            totalSubmissions: playerStatsFormatted.totalSubmissions,
            totalPlayers: leaderboardWithRanks.length,
            address: walletAddress,
            leaderboard: leaderboardWithRanks,
          })
        }
      } catch (statsError) {
        console.error("Error fetching player stats:", statsError)
      }

      return NextResponse.json({
        found: false,
        inTop20: false,
        rank: null,
        totalPlayers: leaderboardWithRanks.length,
        message: "Address not found in leaderboard",
        leaderboard: leaderboardWithRanks,
      })
    }

    // Player is in top 20
    return NextResponse.json({
      found: true,
      inTop20: true,
      rank: playerEntry.rank,
      rawScore: playerEntry.rawScore,
      effectiveScore: playerEntry.effectiveScore,
      level: playerEntry.level,
      referralCount: playerEntry.referralCount,
      timestamp: playerEntry.timestamp,
      totalPlayers: leaderboardWithRanks.length,
      address: walletAddress,
      leaderboard: leaderboardWithRanks,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)

    // Handle specific contract errors
    if (error instanceof Error) {
      if (error.message.includes("execution reverted")) {
        return NextResponse.json({ error: "Contract execution failed" }, { status: 500 })
      }

      if (error.message.includes("network")) {
        return NextResponse.json({ error: "Network connection failed" }, { status: 503 })
      }

      if (error.message.includes("timeout")) {
        return NextResponse.json({ error: "Request timeout - please try again" }, { status: 408 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}