'use server';

import yahooFinance from 'yahoo-finance2';

export const getYahooFinanceQuotes = async (
  symbols: string[],
): Promise<
  {
    symbol: string;
    price?: number;
    earnings?: Date;
  }[]
> => {
  const quotes = await yahooFinance.quote(symbols);
  return quotes.map((quote) => ({
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    earnings: quote.earningsTimestampStart,
  }));
};
