// hooks/useLeaderboard.ts
import { useState, useEffect } from "react"
import { LeaderboardEntry } from "../types/game"
import { CONTRACT_ADDRESS } from "../utils/constants"
import { ABI } from "../utils/abi"

export const useLeaderboard = (publicClient: any, walletClient: any, walletAddress: string) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [playerBestScore, setPlayerBestScore] = useState(0)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  const loadLeaderboard = async () => {
    if (!publicClient) return

    try {
      const topScores = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
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
      
      const formattedScores: LeaderboardEntry[] = Array.from(scoreMap.values());
      setLeaderboard(formattedScores);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  }

  const loadPlayerBestScore = async (address: string) => {
    if (!publicClient || !address) return;
    
    try {
      const bestEntry = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "playerBest",
        args: [address as `0x${string}`],
      });
      
      setPlayerBestScore(Number(bestEntry[1]));
    } catch (error) {
      console.error("Failed to load player best score:", error);
      setPlayerBestScore(0);
    }
  }

  const submitScoreToBlockchain = async (score: number, level: number) => {
    if (!walletClient || !walletAddress) {
      alert("Please connect your wallet to submit scores!")
      return false
    }

    if (score <= playerBestScore) {
      alert("This score is not higher than your current best!")
      return false
    }

    setIsSubmittingScore(true);
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "submitScore",
        args: [BigInt(score), Number(level)],
        account: walletAddress as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await loadLeaderboard();
      await loadPlayerBestScore(walletAddress);
      
      alert(`New high score submitted to blockchain! Score: ${score.toLocaleString()}`);
      return true
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Failed to submit score to blockchain. Please try again.");
      return false
    } finally {
      setIsSubmittingScore(false);
    }
  }

  // Load leaderboard when public client is available
  useEffect(() => {
    if (publicClient) {
      loadLeaderboard()
    }
  }, [publicClient])

  // Load player best score when wallet is connected
  useEffect(() => {
    if (walletAddress && publicClient) {
      loadPlayerBestScore(walletAddress)
    }
  }, [walletAddress, publicClient])

  return {
    leaderboard,
    playerBestScore,
    isSubmittingScore,
    loadLeaderboard,
    loadPlayerBestScore,
    submitScoreToBlockchain
  }
}