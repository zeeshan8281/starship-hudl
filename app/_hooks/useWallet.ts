// hooks/useWallet.ts
import { useState, useEffect } from "react"
import { createWalletClient, custom, createPublicClient, http } from "viem"
import { huddle01Testnet } from "viem/chains"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletClient, setWalletClient] = useState<any>(null)
  const [publicClient, setPublicClient] = useState<any>(null)

  // Initialize public client
  useEffect(() => {
    const initClients = () => {
      const publicClient = createPublicClient({
        chain: huddle01Testnet,
        transport: http(),
      })
      setPublicClient(publicClient)
    }

    initClients()
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to connect your wallet!")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${huddle01Testnet.id.toString(16)}` }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${huddle01Testnet.id.toString(16)}`,
                chainName: huddle01Testnet.name,
                nativeCurrency: huddle01Testnet.nativeCurrency,
                rpcUrls: huddle01Testnet.rpcUrls.default.http,
                blockExplorerUrls: huddle01Testnet.blockExplorers?.default
                  ? [huddle01Testnet.blockExplorers.default.url]
                  : undefined,
              },
            ],
          })
        }
      }

      const walletClient = createWalletClient({
        chain: huddle01Testnet,
        transport: custom(window.ethereum),
      })

      setWalletClient(walletClient)
      setWalletAddress(accounts[0])
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setWalletClient(null)
  }

  return {
    walletAddress,
    isConnecting,
    walletClient,
    publicClient,
    connectWallet,
    disconnectWallet,
    isConnected: !!walletAddress
  }
}