export const ABI = [
	{
		"inputs": [],
		"name": "InvalidInput",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidRange",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotHigherScore",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "newChampion",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "newRecord",
				"type": "uint64"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "level",
				"type": "uint32"
			}
		],
		"name": "NewChampion",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newPlayer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "newReferralCount",
				"type": "uint32"
			}
		],
		"name": "ReferralCredited",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "score",
				"type": "uint64"
			},
			{
				"indexed": false,
				"internalType": "uint32",
				"name": "level",
				"type": "uint32"
			},
			{
				"indexed": false,
				"internalType": "uint64",
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"name": "ScoreSubmitted",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "MAX_LEADERBOARD_SIZE",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "allTimeHighScore",
		"outputs": [
			{
				"internalType": "uint64",
				"name": "",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "championPlayer",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "getEffectiveScore",
		"outputs": [
			{
				"internalType": "uint64",
				"name": "effectiveScore",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getGameStats",
		"outputs": [
			{
				"internalType": "uint64",
				"name": "highScore",
				"type": "uint64"
			},
			{
				"internalType": "address",
				"name": "champion",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "totalSubmissions",
				"type": "uint64"
			},
			{
				"internalType": "uint8",
				"name": "uniquePlayers",
				"type": "uint8"
			},
			{
				"internalType": "uint64",
				"name": "averageTopScore",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint32",
				"name": "targetLevel",
				"type": "uint32"
			}
		],
		"name": "getLevelStats",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "playerCount",
				"type": "uint32"
			},
			{
				"internalType": "uint64",
				"name": "highestScore",
				"type": "uint64"
			},
			{
				"internalType": "uint64",
				"name": "averageScore",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "getMyStats",
		"outputs": [
			{
				"internalType": "uint64",
				"name": "bestScore",
				"type": "uint64"
			},
			{
				"internalType": "uint32",
				"name": "totalSubmissions",
				"type": "uint32"
			},
			{
				"internalType": "uint32",
				"name": "referralCount",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "start",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "howMany",
				"type": "uint256"
			}
		],
		"name": "getPage",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "player",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "score",
						"type": "uint64"
					},
					{
						"internalType": "uint32",
						"name": "level",
						"type": "uint32"
					},
					{
						"internalType": "uint64",
						"name": "timestamp",
						"type": "uint64"
					}
				],
				"internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
				"name": "page",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "getPlayerRank",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "rank",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint8",
				"name": "count",
				"type": "uint8"
			}
		],
		"name": "getRecentActivity",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "player",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "score",
						"type": "uint64"
					},
					{
						"internalType": "uint32",
						"name": "level",
						"type": "uint32"
					},
					{
						"internalType": "uint64",
						"name": "timestamp",
						"type": "uint64"
					}
				],
				"internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
				"name": "recent",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "getReferralCount",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "count",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint8",
				"name": "centerRank",
				"type": "uint8"
			},
			{
				"internalType": "uint8",
				"name": "radius",
				"type": "uint8"
			}
		],
		"name": "getScoresAroundRank",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "player",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "score",
						"type": "uint64"
					},
					{
						"internalType": "uint32",
						"name": "level",
						"type": "uint32"
					},
					{
						"internalType": "uint64",
						"name": "timestamp",
						"type": "uint64"
					}
				],
				"internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
				"name": "entries",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTop20",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "player",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "score",
						"type": "uint64"
					},
					{
						"internalType": "uint32",
						"name": "level",
						"type": "uint32"
					},
					{
						"internalType": "uint64",
						"name": "timestamp",
						"type": "uint64"
					}
				],
				"internalType": "struct StarshipTroopersLeaderboard.ScoreEntry[]",
				"name": "top",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "leaderboardSize",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerBest",
		"outputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "score",
				"type": "uint64"
			},
			{
				"internalType": "uint32",
				"name": "level",
				"type": "uint32"
			},
			{
				"internalType": "uint64",
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerReferralCount",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerSubmissionCount",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "",
				"type": "uint32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint64",
				"name": "_score",
				"type": "uint64"
			},
			{
				"internalType": "uint32",
				"name": "_level",
				"type": "uint32"
			},
			{
				"internalType": "address",
				"name": "_referrer",
				"type": "address"
			}
		],
		"name": "submitScore",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalScoresSubmitted",
		"outputs": [
			{
				"internalType": "uint64",
				"name": "",
				"type": "uint64"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint64",
				"name": "score",
				"type": "uint64"
			},
			{
				"internalType": "address",
				"name": "playerAddress",
				"type": "address"
			}
		],
		"name": "wouldScoreMakeLeaderboard",
		"outputs": [
			{
				"internalType": "bool",
				"name": "wouldMakeIt",
				"type": "bool"
			},
			{
				"internalType": "uint8",
				"name": "estimatedRank",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const;