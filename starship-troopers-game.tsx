"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Zap,
  Target,
  Users,
  Trophy,
  Wallet,
  MessageCircle,
  Play,
  Settings,
  User,
  Sword,
  Rocket,
  Star,
} from "lucide-react"
import Image from "next/image"

export default function Component() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"discord" | "wallet" | null>(null)

  const handleLogin = (method: "discord" | "wallet") => {
    setLoginMethod(method)
    // Simulate login process
    setTimeout(() => {
      setIsLoggedIn(true)
    }, 1500)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fillOpacity=&quot;0.03&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

        <Card className="w-full max-w-md bg-slate-800/90 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src="/huddle01-logo.png" alt="HUDDLE01" width={200} height={60} className="h-12 w-auto" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white mb-2">STARSHIP TROOPERS</CardTitle>
              <CardDescription className="text-blue-200">
                Join the Mobile Infantry. Serve the Federation.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-300 mb-4">Choose your authentication method</p>
            </div>

            <Button
              onClick={() => handleLogin("discord")}
              disabled={loginMethod === "discord"}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white h-12"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              {loginMethod === "discord" ? "Connecting..." : "Login with Discord"}
            </Button>

            <Button
              onClick={() => handleLogin("wallet")}
              disabled={loginMethod === "wallet"}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white h-12"
            >
              <Wallet className="mr-2 h-5 w-5" />
              {loginMethod === "wallet" ? "Connecting..." : "Connect Wallet"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-xs text-slate-400">Service guarantees citizenship</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-blue-500/30 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image src="/huddle01-logo.png" alt="HUDDLE01" width={120} height={36} className="h-8 w-auto" />
            <Badge variant="outline" className="border-blue-400 text-blue-300">
              MOBILE INFANTRY
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Badge className="bg-green-600 text-white">
              <User className="w-3 h-3 mr-1" />
              Trooper {loginMethod === "discord" ? "Rico" : "Alpha-7"}
            </Badge>
            <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Briefing */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5 text-red-400" />
                  Current Mission: Bug Hunt
                </CardTitle>
                <CardDescription className="text-blue-200">Klendathu System - Sector 7G</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-lg border border-red-500/30 flex items-center justify-center">
                    <div className="text-center">
                      <Rocket className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <p className="text-white font-semibold">TACTICAL MAP</p>
                      <p className="text-sm text-slate-300">Drop Zone Alpha</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">847</p>
                      <p className="text-sm text-slate-300">Bugs Eliminated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">23</p>
                      <p className="text-sm text-slate-300">Troopers Active</p>
                    </div>
                  </div>

                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-12">
                    <Play className="mr-2 h-5 w-5" />
                    DEPLOY TO BATTLEFIELD
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Tabs */}
            <Tabs defaultValue="arsenal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                <TabsTrigger value="arsenal" className="text-white data-[state=active]:bg-blue-600">
                  <Sword className="mr-2 h-4 w-4" />
                  Arsenal
                </TabsTrigger>
                <TabsTrigger value="squad" className="text-white data-[state=active]:bg-blue-600">
                  <Users className="mr-2 h-4 w-4" />
                  Squad
                </TabsTrigger>
                <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-blue-600">
                  <Trophy className="mr-2 h-4 w-4" />
                  Honors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="arsenal" className="space-y-4">
                <Card className="bg-slate-800/50 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "Morita Assault Rifle", damage: 85, ammo: 300 },
                        { name: "Rocket Launcher", damage: 95, ammo: 12 },
                        { name: "Plasma Rifle", damage: 78, ammo: 150 },
                        { name: "Tactical Nuke", damage: 100, ammo: 1 },
                      ].map((weapon, index) => (
                        <div key={index} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <h4 className="text-white font-semibold mb-2">{weapon.name}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-300">Damage</span>
                              <span className="text-red-400">{weapon.damage}%</span>
                            </div>
                            <Progress value={weapon.damage} className="h-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-300">Ammo</span>
                              <span className="text-blue-400">{weapon.ammo}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="squad" className="space-y-4">
                <Card className="bg-slate-800/50 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[
                        { name: "Carmen Ibanez", rank: "Lieutenant", status: "Active" },
                        { name: "Carl Jenkins", rank: "Psychic", status: "Active" },
                        { name: "Dizzy Flores", rank: "Private", status: "KIA" },
                        { name: "Ace Levy", rank: "Corporal", status: "Active" },
                      ].map((member, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{member.name}</p>
                              <p className="text-sm text-slate-300">{member.rank}</p>
                            </div>
                          </div>
                          <Badge
                            variant={member.status === "Active" ? "default" : "destructive"}
                            className={member.status === "Active" ? "bg-green-600" : ""}
                          >
                            {member.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card className="bg-slate-800/50 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "Bug Stomper", description: "Eliminate 100 Arachnids", earned: true },
                        { name: "Hero of the Federation", description: "Complete 10 missions", earned: true },
                        { name: "Klendathu Veteran", description: "Survive the Klendathu drop", earned: false },
                        { name: "Psychic Warrior", description: "Use brain bug intel", earned: false },
                      ].map((achievement, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            achievement.earned
                              ? "bg-yellow-900/20 border-yellow-500/30"
                              : "bg-slate-700/50 border-slate-600"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Star className={`h-6 w-6 ${achievement.earned ? "text-yellow-400" : "text-slate-500"}`} />
                            <div>
                              <h4 className="text-white font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-slate-300">{achievement.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Stats */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-400" />
                  Trooper Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Health</span>
                      <span className="text-green-400">87/100</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Armor</span>
                      <span className="text-blue-400">65/100</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Morale</span>
                      <span className="text-yellow-400">92/100</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">12</p>
                      <p className="text-xs text-slate-300">Rank</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">1,247</p>
                      <p className="text-xs text-slate-300">XP</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-yellow-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white"
                >
                  Join Voice Channel
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-green-500 text-green-300 hover:bg-green-600 hover:text-white"
                >
                  Request Backup
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-500 text-red-300 hover:bg-red-600 hover:text-white"
                >
                  Emergency Evac
                </Button>
              </CardContent>
            </Card>

            {/* Federation News */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white text-sm">Federation News</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="border-l-2 border-blue-500 pl-3">
                    <p className="text-white font-medium">New Bug Colony Discovered</p>
                    <p className="text-slate-300 text-xs">Sector 9 requires immediate attention</p>
                  </div>
                  <div className="border-l-2 border-yellow-500 pl-3">
                    <p className="text-white font-medium">Citizenship Drive</p>
                    <p className="text-slate-300 text-xs">Service guarantees citizenship</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
