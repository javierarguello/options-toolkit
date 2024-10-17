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

export const getVIXPriceHistory = async (): Promise<
  {
    date: Date;
    price: number;
  }[]
> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14); // 2 weeks ago

  const result = await yahooFinance.historical('^VIX', {
    period1: startDate,
    period2: endDate,
  });

  return result.map((item) => ({
    date: item.date,
    price: item.close,
  }));
};
