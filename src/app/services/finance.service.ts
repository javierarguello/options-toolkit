'use server';

import { restClient } from '@polygon.io/client-js';
import { ISymbolFinanceData } from '../models';
import { getPriceAndOptionChain } from './finnhub.service';

// Initialize Polygon client
const polygonClient = restClient(process.env.POLYGON_API_KEY);

// Export the class methods directly
export async function financeValidateSymbol(
  symbol: string,
): Promise<ISymbolFinanceData> {
  try {
    const symbolUpper = symbol.trim().toUpperCase();
    const { price, optionChain } = await getPriceAndOptionChain(symbolUpper);

    return {
      valid: true,
      name: symbolUpper,
      price,
      optionChain,
    };
  } catch (error) {
    console.error('Error validating symbol:', error);
    return { valid: false, error: 'Invalid symbol', name: symbol };
  }
}
