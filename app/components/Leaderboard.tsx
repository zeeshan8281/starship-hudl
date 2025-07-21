// components/Leaderboard.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Crown, Calendar } from "lucide-react"
import { LeaderboardEntry } from "../types/game"

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
  currentUserAddress: string
  className?: string
}

export default function Leaderboard({ leaderboard, currentUserAddress, className = "" }: LeaderboardProps) {
  return (
    <Card className={`bg-slate-800/90 border-blue-500/30 backdrop-blur-sm ${className}`}>
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
                    entry.address.toLowerCase() === currentUserAddress.toLowerCase()
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
  )
}