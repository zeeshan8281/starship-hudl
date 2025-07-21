// hooks/useLeaderboard.ts (Optimized to use contract's effective scores)
import { useState, useEffect } from "react"
import { PlayerStats, GameStats } from "../_types/game"
import { CONTRACT_ADDRESS } from "../_utils/constants"
import { ABI } from "../_utils/abi"

// Interface matching the contract's EffectiveScoreEntry struct
interface EffectiveScoreEntry {
  player: string
  rawScore: number
  effectiveScore: number
  level: number
  timestamp: number
  referralCount: number
}

export const useLeaderboard = (publicClient: any, walletClient: any, walletAddress: string) => {
  const [leaderboard, setLeaderboard] = useState<EffectiveScoreEntry[]>([])
  const [playerBestScore, setPlayerBestScore] = useState(0)
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    bestScore: 0,
    totalSubmissions: 0,
    referralCount: 0,
    effectiveScore: 0
  })
  const [gameStats, setGameStats] = useState<GameStats>({
    highScore: 0,
    champion: "",
    totalSubmissions: 0,
    uniquePlayers: 0,
    averageTopScore: 0
  })
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [referralCode, setReferralCode] = useState<string>("")

  const loadLeaderboard = async () => {
    if (!publicClient) return

    try {
      // Use the new getTop20() function that returns EffectiveScoreEntry[]
      const topScores = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getTop20",
        args: [],
      });

      console.log(topScores)

      // Convert the contract response to our interface
      const formattedScores: EffectiveScoreEntry[] = topScores.map((entry: any) => ({
        player: entry.player,
        rawScore: Number(entry.rawScore),
        effectiveScore: Number(entry.effectiveScore),
        level: Number(entry.level),
        timestamp: Number(entry.timestamp),
        referralCount: Number(entry.referralCount)
      }));

      // Scores are already sorted by effective score from the contract
      setLeaderboard(formattedScores);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  }

  const loadPlayerStats = async (address: string) => {
    if (!publicClient || !address) return;
    
    try {
      // Get comprehensive player stats
      const stats = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getMyStats",
        args: [address as `0x${string}`],
      });

      // Get effective score (score + referral bonus)
      const effectiveScore = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getEffectiveScore",
        args: [address as `0x${string}`],
      });

      const playerStats: PlayerStats = {
        bestScore: Number(stats[0]),
        totalSubmissions: Number(stats[1]),
        referralCount: Number(stats[2]),
        effectiveScore: Number(effectiveScore)
      };

      setPlayerStats(playerStats);
      setPlayerBestScore(playerStats.bestScore);
    } catch (error) {
      console.error("Failed to load player stats:", error);
      setPlayerStats({
        bestScore: 0,
        totalSubmissions: 0,
        referralCount: 0,
        effectiveScore: 0
      });
      setPlayerBestScore(0);
    }
  }

  const loadGameStats = async () => {
    if (!publicClient) return;
    
    try {
      const stats = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getGameStats",
        args: [],
      });

      setGameStats({
        highScore: Number(stats[0]),
        champion: stats[1],
        totalSubmissions: Number(stats[2]),
        uniquePlayers: Number(stats[3]),
        averageTopScore: Number(stats[4])
      });
    } catch (error) {
      console.error("Failed to load game stats:", error);
    }
  }

  const submitScoreToBlockchain = async (score: number, level: number, referrerAddress?: string) => {
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
      // Parse referrer address or use zero address
      const referrer = referrerAddress && referrerAddress.startsWith('0x') 
        ? referrerAddress as `0x${string}`
        : "0x0000000000000000000000000000000000000000" as `0x${string}`;

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "submitScore",
        args: [BigInt(score), Number(level), referrer],
        account: walletAddress as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      // Force leaderboard update on the contract
      try {
        await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "updateLeaderboard",
          args: [],
        });
      } catch (error) {
        console.log("Leaderboard update called (may have already been updated)");
      }
      
      // Reload all data
      await Promise.all([
        loadLeaderboard(),
        loadPlayerStats(walletAddress),
        loadGameStats()
      ]);
      
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

  const getPlayerRank = async (address: string): Promise<number> => {
    if (!publicClient) return 0;
    
    try {
      const rank = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getPlayerRank",
        args: [address as `0x${string}`],
      });
      
      return Number(rank);
    } catch (error) {
      console.error("Failed to get player rank:", error);
      return 0;
    }
  }

  const checkScoreWouldMakeLeaderboard = async (score: number, address: string) => {
    if (!publicClient) return { wouldMakeIt: false, estimatedRank: 0 };
    
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "wouldScoreMakeLeaderboard",
        args: [BigInt(score), address as `0x${string}`],
      });
      
      return {
        wouldMakeIt: result[0],
        estimatedRank: Number(result[1])
      };
    } catch (error) {
      console.error("Failed to check score eligibility:", error);
      return { wouldMakeIt: false, estimatedRank: 0 };
    }
  }

  // Generate referral code from wallet address
  const generateReferralCode = (address: string): string => {
    if (!address) return "";
    return address.toLowerCase();
  }

  // Parse referral code from URL or input
  const parseReferralCode = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralParam = urlParams.get('ref');
    return referralParam || "";
  }

  // Load data when dependencies change
  useEffect(() => {
    if (publicClient) {
      loadLeaderboard();
      loadGameStats();
    }
  }, [publicClient])

  useEffect(() => {
    if (walletAddress && publicClient) {
      loadPlayerStats(walletAddress);
      setReferralCode(generateReferralCode(walletAddress));
    }
  }, [walletAddress, publicClient])

  // Parse referral code on mount
  useEffect(() => {
    const parsed = parseReferralCode();
    if (parsed) {
      console.log("Referral code detected:", parsed);
    }
  }, [])

  return {
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
    getPlayerRank,
    checkScoreWouldMakeLeaderboard,
    generateReferralCode,
    parseReferralCode
  }
}