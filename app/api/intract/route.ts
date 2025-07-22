import { ABI } from '@/app/_utils/abi';
import { CONTRACT_ADDRESS } from '@/app/_utils/constants';
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { huddle01Testnet } from 'viem/chains';

export async function POST(req: Request) {
  try {
    const { address } = (await req.json()) as { address: `0x${string}` };

    let result = false;

    const publicClient = createPublicClient({
      chain: huddle01Testnet,
      transport: http(),
    })

    const [_, totalSubmissions,] = await publicClient.readContract({
      abi: ABI,
      address: CONTRACT_ADDRESS,
      functionName: 'getMyStats',
      args: [address],
    });

    if (totalSubmissions > 0) result = true;

    return NextResponse.json({
      data: {
        result,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: {
        code: 0,
        message: 'Internal server error',
      },
      data: {
        result: false,
      },
    });
  }
}
