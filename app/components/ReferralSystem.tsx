// components/ReferralSystem.tsx (New referral component)
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Share2, Users, Gift, ExternalLink } from "lucide-react"
import { PlayerStats } from "../types/game"

interface ReferralSystemProps {
  referralCode: string
  playerStats: PlayerStats
  onCopyReferralLink: () => void
}

export default function ReferralSystem({ 
  referralCode, 
  playerStats, 
  onCopyReferralLink 
}: ReferralSystemProps) {
  const [copied, setCopied] = useState(false)
  
  const referralLink = `${window.location.origin}?ref=${referralCode}`
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopyReferralLink()
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me in Starship Troopers!',
          text: 'Play this awesome space shooter game and earn rewards!',
          url: referralLink
        })
      } catch (error) {
        console.error("Failed to share:", error)
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <Card className="bg-slate-800/90 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center">
          <Users className="mr-2 h-5 w-5 text-purple-400" />
          REFERRAL PROGRAM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Stats */}
        <div className="grid grid-cols-1">
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-mono text-slate-300">REFERRALS</span>
            </div>
            <p className="text-2xl font-bold text-purple-400 font-mono">
              {playerStats.referralCount}
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300">YOUR REFERRAL LINK</label>
          <div className="flex space-x-2">
            <Input 
              value={referralLink}
              readOnly
              className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className={`font-mono ${copied ? 'text-green-400' : 'text-blue-400'}`}
            >
              <Copy className="h-4 w-4" />
              {copied ? 'COPIED!' : 'COPY'}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleShare}
            className="flex-1 bg-purple-600 hover:bg-purple-700 font-mono text-sm"
          >
            <Share2 className="mr-2 h-4 w-4" />
            SHARE LINK
          </Button>
          <Button
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join me in Starship Troopers! 🚀 Play this awesome space shooter and earn rewards! ${referralLink}`, '_blank')}
            variant="outline"
            className="font-mono text-sm border-blue-400 text-blue-400"
          >
            <ExternalLink className="h-4 w-4" />
            TWEET
          </Button>
        </div>

        {/* How it works */}
        <div className="bg-slate-700/50 rounded-lg p-3">
          <h4 className="text-sm font-mono text-white mb-2">HOW IT WORKS</h4>
          <ul className="text-xs font-mono text-slate-300 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• Get +100 effective score per referral</li>
            <li>• Higher effective score = better leaderboard rank</li>
            <li>• No limit on referrals!</li>
          </ul>
        </div>

        {/* Current Bonus Display */}
        {playerStats.referralCount > 0 && (
          <div className="text-center">
            <Badge className="bg-gradient-to-r from-purple-600 to-yellow-600 text-white font-mono">
              <Gift className="w-3 h-3 mr-1" />
              EARNING +{playerStats.referralCount * 100} BONUS POINTS
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}