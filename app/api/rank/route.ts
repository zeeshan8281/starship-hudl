import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, getContract } from "viem"
import { huddle01Testnet } from "viem/chains"

// Smart contract ABI - only need the getTopScores function
const LEADERBOARD_ABI = [
  {
    inputs: [],
    name: "getTopScores",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "score", type: "uint256" },
          { internalType: "uint256", name: "level", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "discordUsername", type: "string" },
        ],
        internalType: "struct StarshipTroopersLeaderboard.ScoreEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

const CONTRACT_ADDRESS = "0x5105404B431de314116A47de4b0daa74Ab966A8D" as `0x${string}`

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

    // Get contract instance
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: LEADERBOARD_ABI,
      client: publicClient,
    })

    // Fetch top scores from contract
    const topScores = await contract.read.getTopScores()

    // Convert to a more manageable format
    const leaderboard = topScores.map((entry: any, index: number) => ({
      rank: index + 1,
      address: entry.player.toLowerCase(),
      score: Number(entry.score),
      level: Number(entry.level),
      timestamp: Number(entry.timestamp),
      discordUsername: entry.discordUsername || "",
    }))

    // Find the rank of the requested wallet address
    const normalizedAddress = walletAddress.toLowerCase()
    const playerEntry = leaderboard.find((entry) => entry.address === normalizedAddress)

    if (!playerEntry) {
      return NextResponse.json({
        found: false,
        rank: null,
        totalPlayers: leaderboard.length,
        message: "Address not found in leaderboard",
      })
    }

    return NextResponse.json({
      found: true,
      rank: playerEntry.rank,
      score: playerEntry.score,
      level: playerEntry.level,
      discordUsername: playerEntry.discordUsername,
      timestamp: playerEntry.timestamp,
      totalPlayers: leaderboard.length,
      address: walletAddress,
    })
  } catch (error) {
    console.error("Error fetching rank:", error)

    // Handle specific contract errors
    if (error instanceof Error) {
      if (error.message.includes("execution reverted")) {
        return NextResponse.json({ error: "Contract execution failed" }, { status: 500 })
      }

      if (error.message.includes("network")) {
        return NextResponse.json({ error: "Network connection failed" }, { status: 503 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Optional: Add POST method for batch rank queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { addresses } = body

    // Validate input
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: "Array of addresses is required" }, { status: 400 })
    }

    // Limit batch size to prevent abuse
    if (addresses.length > 50) {
      return NextResponse.json({ error: "Maximum 50 addresses allowed per batch" }, { status: 400 })
    }

    // Validate all addresses
    for (const address of addresses) {
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return NextResponse.json({ error: `Invalid address format: ${address}` }, { status: 400 })
      }
    }

    // Get contract instance
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: LEADERBOARD_ABI,
      client: publicClient,
    })

    // Fetch top scores from contract
    const topScores = await contract.read.getTopScores()

    // Convert to a more manageable format
    const leaderboard = topScores.map((entry: any, index: number) => ({
      rank: index + 1,
      address: entry.player.toLowerCase(),
      score: Number(entry.score),
      level: Number(entry.level),
      timestamp: Number(entry.timestamp),
      discordUsername: entry.discordUsername || "",
    }))

    // Find ranks for all requested addresses
    const results = addresses.map((address) => {
      const normalizedAddress = address.toLowerCase()
      const playerEntry = leaderboard.find((entry) => entry.address === normalizedAddress)

      if (!playerEntry) {
        return {
          address,
          found: false,
          rank: null,
          message: "Address not found in leaderboard",
        }
      }

      return {
        address,
        found: true,
        rank: playerEntry.rank,
        score: playerEntry.score,
        level: playerEntry.level,
        discordUsername: playerEntry.discordUsername,
        timestamp: playerEntry.timestamp,
      }
    })

    return NextResponse.json({
      totalPlayers: leaderboard.length,
      results,
    })
  } catch (error) {
    console.error("Error fetching batch ranks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
