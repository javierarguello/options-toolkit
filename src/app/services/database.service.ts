'use server';

import { PrismaClient, Trade } from '@prisma/client';
import { ITrade } from '../models';

const prisma = new PrismaClient();

export async function addTrade(trade: ITrade): Promise<ITrade> {
  const result = await prisma.trade.create({
    data: { id: trade.id as bigint, ...trade },
  });
  return mapTradeToITrade(result);
}

export async function updateTrade(
  id: bigint,
  trade: Partial<ITrade>,
): Promise<ITrade> {
  const result = await prisma.trade.update({
    where: { id },
    data: trade,
  });
  return mapTradeToITrade(result);
}

export async function deleteTrade(id: bigint): Promise<ITrade> {
  const result = await prisma.trade.delete({
    where: { id },
  });
  return mapTradeToITrade(result);
}

export async function getTrade(id: number): Promise<ITrade | null> {
  const result = await prisma.trade.findUnique({
    where: { id },
  });
  return result ? mapTradeToITrade(result) : null;
}

export async function getAllTrades(): Promise<ITrade[]> {
  const results = await prisma.trade.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return results.map(mapTradeToITrade);
}

function mapTradeToITrade(trade: Trade): ITrade {
  return trade as ITrade;
}
