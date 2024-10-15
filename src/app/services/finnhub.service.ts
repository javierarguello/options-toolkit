import axios from 'axios';
import { IStockData } from '../models';

export const getPriceAndOptionChain = async (
  symbol: string,
): Promise<{ price: number; optionChain: IStockData }> => {
  const apiKey = process.env.FINNHUB_API_KEY as string;

  try {
    // Fetch the current stock price
    const quoteResponse = await axios.get('https://finnhub.io/api/v1/quote', {
      params: {
        symbol: symbol,
        token: apiKey,
      },
    });

    const price = quoteResponse.data.c; // Current price

    // Fetch the option chain
    const optionChainResponse = await axios.get(
      'https://finnhub.io/api/v1/stock/option-chain',
      {
        params: {
          symbol: symbol,
          token: apiKey,
        },
      },
    );

    const optionChain = optionChainResponse.data;

    return { price, optionChain };
  } catch (error) {
    console.error('Error fetching data from Finnhub:', error);
    throw error;
  }
};
