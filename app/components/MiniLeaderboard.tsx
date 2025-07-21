// components/MiniLeaderboard.tsx (Simplified - showing only effective scores)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Users, Star, Gift } from "lucide-react"
import { PlayerStats, GameStats } from "../types/game"

interface EffectiveScoreEntry {
  player: string
  rawScore: number
  effectiveScore: number
  level: number
  timestamp: number
  referralCount: number
}

interface MiniLeaderboardProps {
  leaderboard: EffectiveScoreEntry[]
  currentUserAddress: string
  playerStats: PlayerStats
  gameStats: GameStats
}

export default function MiniLeaderboard({ 
  leaderboard, 
  currentUserAddress, 
  playerStats, 
  gameStats 
}: MiniLeaderboardProps) {
  return (
    <Card className="bg-slate-800/50 border-blue-500/30 h-full">
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
            TOP TROOPERS
          </div>
          <Badge variant="outline" className="border-green-400 text-green-300 font-mono text-xs">
            <Users className="w-3 h-3 mr-1" />
            {gameStats.uniquePlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Stats for Current Player */}
        {currentUserAddress && playerStats.bestScore > 0 && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <div className="text-xs font-mono text-center">
              <p className="text-slate-300 mb-1">YOUR STATS</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-400 font-bold">{playerStats.bestScore.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Raw Score</p>
                </div>
                {playerStats.referralCount > 0 && (
                  <div>
                    <p className="text-purple-400 font-bold">{playerStats.referralCount}</p>
                    <p className="text-xs text-slate-400">Referrals</p>
                  </div>
                )}
                <div>
                  <p className="text-yellow-400 font-bold">{playerStats.effectiveScore.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Effective</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple legend */}
        <div className="mb-3 p-2 bg-slate-700/50 rounded text-xs font-mono text-slate-300">
          <p>🏆 <span className="text-yellow-400">Effective Scores</span></p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-slate-400 font-mono text-sm">
            <p>NO SCORES YET</p>
            <p>BE THE FIRST!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 10).map((entry, index) => {
              const isCurrentUser = entry.player.toLowerCase() === currentUserAddress.toLowerCase()
              const isChampion = entry.player.toLowerCase() === gameStats.champion.toLowerCase()
              const hasReferralBonus = entry.referralCount > 0
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser
                      ? "bg-yellow-900/30 border border-yellow-500/30"
                      : "bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm">
                      {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <p className="text-white font-mono text-xs">
                          {`${entry.player.slice(0, 4)}...${entry.player.slice(-3)}`}
                        </p>
                        {isChampion && (
                          <Star className="w-3 h-3 text-yellow-400" />
                        )}
                        {hasReferralBonus && (
                          <Gift className="w-3 h-3 text-purple-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                        <span>L{entry.level}</span>
                        {hasReferralBonus && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400">{entry.referralCount} refs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Show only effective score */}
                    <p className="text-yellow-400 font-mono text-sm font-bold">
                      {entry.effectiveScore.toLocaleString()}
                    </p>
                    {hasReferralBonus && (
                      <p className="text-xs text-purple-400 font-mono">
                        +{entry.referralCount * 100}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Game Stats Footer */}
        {gameStats.totalSubmissions > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-600">
            <div className="text-center">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <div>
                  <p className="text-blue-400 font-bold">{gameStats.totalSubmissions.toLocaleString()}</p>
                  <p>Total Scores</p>
                </div>
                <div>
                  <p className="text-green-400 font-bold">{gameStats.averageTopScore.toLocaleString()}</p>
                  <p>Avg Top 10</p>
                </div>
              </div>
              {gameStats.champion && (
                <div className="mt-2">
                  <Badge className="bg-yellow-600 text-white font-mono text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    CHAMPION: {gameStats.champion.slice(0, 6)}...{gameStats.champion.slice(-4)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}