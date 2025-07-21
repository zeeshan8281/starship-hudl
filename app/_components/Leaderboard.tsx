// components/Leaderboard.tsx (Simplified - showing only effective scores)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Calendar, Users, Star, Gift } from "lucide-react"
import { PlayerStats, GameStats } from "../_types/game"

interface EffectiveScoreEntry {
  player: string
  rawScore: number
  effectiveScore: number
  level: number
  timestamp: number
  referralCount: number
}

interface LeaderboardProps {
  leaderboard: EffectiveScoreEntry[]
  currentUserAddress: string
  playerStats: PlayerStats
  gameStats: GameStats
  className?: string
}

export default function Leaderboard({ 
  leaderboard, 
  currentUserAddress, 
  playerStats,
  gameStats,
  className = "" 
}: LeaderboardProps) {
  return (
    <Card className={`bg-slate-800/90 border-blue-500/30 backdrop-blur-sm w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center justify-between px-2 md:px-6" style={{minWidth:'0'}}>
          <div className="flex items-center min-w-0">
            <Trophy className="mr-2 h-5 w-5 text-yellow-400 flex-shrink-0" />
            <span className="truncate text-2xl md:text-3xl font-bold tracking-tight">GLOBAL LEADERBOARD</span>
          </div>
          <div className="flex items-center space-x-4 text-sm flex-shrink-0">
            <Badge variant="outline" className="border-green-400 text-green-300 font-mono px-3 py-1 text-base">
              <Users className="w-3 h-3 mr-1" />
              {gameStats.uniquePlayers} PLAYERS
            </Badge>
            <Badge variant="outline" className="border-yellow-400 text-yellow-300 font-mono px-3 py-1 text-base">
              <Star className="w-3 h-3 mr-1" />
              RECORD: {gameStats.highScore.toLocaleString()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Player Stats Summary */}
        {currentUserAddress && playerStats.bestScore > 0 && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <p className="text-slate-300">YOUR RAW SCORE</p>
                <p className="text-green-400 font-bold">{playerStats.bestScore.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-300">EFFECTIVE SCORE</p>
                <p className="text-yellow-400 font-bold">{playerStats.effectiveScore.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-300">SUBMISSIONS</p>
                <p className="text-blue-400 font-bold">{playerStats.totalSubmissions}</p>
              </div>
              <div>
                <p className="text-slate-300">REFERRALS</p>
                <p className="text-purple-400 font-bold">{playerStats.referralCount}</p>
                {playerStats.referralCount > 0 && (
                  <p className="text-xs text-purple-300">+{playerStats.referralCount * 100} bonus</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Simple legend */}
        <div className="mb-3 p-2 bg-slate-700/50 rounded text-xs font-mono text-slate-300">
          <p>🏆 Ranked by <span className="text-yellow-400">Effective Score</span> (Raw Score + Referral Bonuses)</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-slate-400 font-mono text-sm">
            <p>NO SCORES YET</p>
            <p>BE THE FIRST TROOPER!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {leaderboard.slice(0, 5).map((entry, index) => {
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
                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                        <p className="text-white font-mono text-xs">
                          {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                        </p>
                        {isChampion && (
                          <Badge className="bg-yellow-600 text-white text-xs font-mono py-0 px-1">
                            CHAMPION
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                        <span>LVL {entry.level}</span>
                        {hasReferralBonus && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400">{entry.referralCount} REF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
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
            {leaderboard.length > 5 && leaderboard.slice(5).map((entry, index) => {
              const trueIndex = index + 5
              const isCurrentUser = entry.player.toLowerCase() === currentUserAddress.toLowerCase()
              const isChampion = entry.player.toLowerCase() === gameStats.champion.toLowerCase()
              const hasReferralBonus = entry.referralCount > 0
              
              return (
                <div
                  key={trueIndex}
                  className={`flex items-center justify-between p-3 rounded-lg opacity-80 hover:opacity-100 transition ${
                    isCurrentUser
                      ? "bg-yellow-900/30 border border-yellow-500/30"
                      : "bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm">
                      {trueIndex === 0 ? <Crown className="w-4 h-4" /> : trueIndex + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                        <p className="text-white font-mono text-xs">
                          {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                        </p>
                        {isChampion && (
                          <Badge className="bg-yellow-600 text-white text-xs font-mono py-0 px-1">
                            CHAMPION
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                        <span>LVL {entry.level}</span>
                        {hasReferralBonus && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400">{entry.referralCount} REF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
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
        <div className="mt-4 pt-3 border-t border-slate-600">
          <div className="grid grid-cols-3 gap-4 text-xs font-mono text-slate-400 text-center">
            <div>
              <p>TOTAL SCORES</p>
              <p className="text-blue-400 font-bold">{gameStats.totalSubmissions.toLocaleString()}</p>
            </div>
            <div>
              <p>AVG TOP 10</p>
              <p className="text-green-400 font-bold">{gameStats.averageTopScore.toLocaleString()}</p>
            </div>
            <div>
              <p>CHAMPION</p>
              <p className="text-yellow-400 font-bold">
                {gameStats.champion ? `${gameStats.champion.slice(0, 6)}...` : "NONE"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
