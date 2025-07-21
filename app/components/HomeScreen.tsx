// components/HomeScreen.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Play, Trophy } from "lucide-react"
import Image from "next/image"
import Leaderboard from "./Leaderboard"
import { LeaderboardEntry } from "../types/game"

interface HomeScreenProps {
  isLoggedIn: boolean
  isConnecting: boolean
  walletAddress: string
  playerBestScore: number
  leaderboard: LeaderboardEntry[]
  onConnectWallet: () => Promise<void>
  onDisconnectWallet: () => void
  onStartGame: () => void
}

export default function HomeScreen({
  isLoggedIn,
  isConnecting,
  walletAddress,
  playerBestScore,
  leaderboard,
  onConnectWallet,
  onDisconnectWallet,
  onStartGame
}: HomeScreenProps) {
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
                    onClick={onConnectWallet}
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

                  <Button onClick={onStartGame} className="w-full bg-red-600 hover:bg-red-700 font-mono text-lg h-14">
                    <Play className="mr-2 h-6 w-6" />
                    START MISSION
                  </Button>

                  <Button
                    onClick={onDisconnectWallet}
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
          <Leaderboard 
            leaderboard={leaderboard} 
            currentUserAddress={walletAddress} 
          />
        </div>
      </div>
    </div>
  )
}