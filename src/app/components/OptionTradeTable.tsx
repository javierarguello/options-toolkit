'use client';

import { useState, useEffect } from 'react';
import { ITrade } from '../models';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon, // Add this import
} from '@heroicons/react/24/solid';

// Add this import for the server function
import { getYahooFinanceQuotes } from '@/app/services/yahoo.finance.service';

export default function OptionTradeTable({
  trades,
  onDeleteTrade,
  onEditTrade,
}: {
  trades: ITrade[];
  onDeleteTrade: (id: bigint) => void;
  onEditTrade: (trade: ITrade) => void;
}) {
  const [tradeToDelete, setTradeToDelete] = useState<ITrade | null>(null);
  const [lastTradeQuotes, setLastTradeQuotes] = useState<
    Record<
      string,
      {
        symbol: string;
        price?: number;
        earnings?: Date;
      }
    >
  >({});

  useEffect(() => {
    const fetchLatestPrices = async () => {
      if (trades.length > 0) {
        const symbols = Array.from(
          new Set(
            trades
              .filter((trade) => trade.exitPrice && trade.exitPrice > 0)
              .map((trade) => trade.symbol),
          ),
        );
        const quotes = await getYahooFinanceQuotes(symbols);
        // Convert quotes array to a dictionary
        const quotesDict = quotes.reduce((acc, quote) => {
          acc[quote.symbol] = quote;
          return acc;
        }, {} as Record<string, { symbol: string; price?: number; earnings?: Date }>);
        setLastTradeQuotes(quotesDict);
      }
    };

    fetchLatestPrices();
  }, [trades]);

  // Calculate total credit/debit and profit
  const totalCreditDebit = trades.reduce((sum, trade) => {
    const multiplier = trade.type.toLowerCase().startsWith('short') ? 1 : -1;
    return sum + multiplier * trade.price * trade.contracts * 100;
  }, 0);

  const totalProfit = trades.reduce((sum, trade) => {
    return sum + (trade.exitPrice ? calculateProfitLoss(trade) : 0);
  }, 0);

  return (
    <>
      {/* New card section */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Credit/Debit</h3>
          <p
            className={`text-2xl font-bold ${
              totalCreditDebit >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {formatCurrency(totalCreditDebit)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Profit/Loss</h3>
          <p
            className={`text-2xl font-bold ${
              totalProfit >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Stock $</th>
            <th className="border p-2">Strike</th>
            <th className="border p-2">Trade $</th>
            <th className="border p-2">Expiration</th>
            <th className="border p-2">Contracts</th>
            <th className="border p-2">Credit/Debit</th>
            <th className="border p-2">Min. Exit $</th>
            <th className="border p-2">Exit $</th>
            <th className="border p-2">Profit/Loss</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">...</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade: ITrade, index: number) => (
            <tr
              key={trade.id}
              onClick={() => onEditTrade(trade)}
              className={`cursor-pointer transition-colors duration-150 ease-in-out
                ${
                  index % 2 === 0
                    ? 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                }`}
            >
              <td className="border p-2 text-center flex flex-col items-center">
                <TradeTypeIcon type={trade.type} />
                <div className="text-xs">{formatTradeType(trade.type)}</div>
                <div className="font-bold">{trade.symbol}</div>
              </td>
              <td className="border p-2 text-right">
                {lastTradeQuotes[trade.symbol]
                  ? formatCurrency(
                      lastTradeQuotes[trade.symbol].price ?? trade.stockPrice,
                    )
                  : formatCurrency(trade.stockPrice)}
              </td>
              <td className="border p-2 text-right">
                <div>{formatCurrency(trade.strike)}</div>
                {trade.type.toLowerCase().startsWith('short') && (
                  <div className="text-xs text-gray-500">
                    BE: {formatCurrency(calculateBreakeven(trade))}
                  </div>
                )}
              </td>
              <td className="border p-2 text-right">
                {formatCurrency(trade.price)}
              </td>
              <td className="border p-2 text-right">
                <div className="flex items-center justify-end">
                  <span>{formatDate(trade.expirationDate)}</span>
                  {lastTradeQuotes[trade.symbol]?.earnings &&
                    new Date(lastTradeQuotes[trade.symbol].earnings!) <
                      trade.expirationDate && (
                      <BellAlertIcon
                        className="w-5 h-5 text-yellow-500 ml-1"
                        title="Earnings before expiration"
                      />
                    )}
                  {isExpirationWarning(trade.expirationDate) && (
                    <ExclamationTriangleIcon
                      className="w-5 h-5 text-yellow-500 ml-1"
                      title="Expiration approaching"
                    />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {getDaysToExpiration(trade.expirationDate)} days
                </div>
              </td>
              <td className="border p-2 text-right">{trade.contracts}</td>
              <td className="border p-2 text-right">
                {formatCreditDebit(
                  trade.price * trade.contracts * 100,
                  trade.type,
                )}
              </td>
              <td className="border p-2 text-right">
                {formatCurrency(calculateMinExitPrice(trade))}
              </td>
              <td className="border p-2 text-right">
                {trade.exitPrice ? formatCurrency(trade.exitPrice) : ''}
              </td>
              <td className="border p-2 text-right">
                {trade.exitPrice ? (
                  <div className="flex flex-col items-end">
                    {formatCreditDebit(calculateProfitLoss(trade), trade.type)}
                    <span
                      className={`text-xs ${
                        calculateProfitLoss(trade) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      ({calculatePercentage(trade).toFixed(2)}%)
                    </span>
                  </div>
                ) : (
                  ''
                )}
              </td>
              <td className="border p-2 text-center">
                {trade.exitPrice ? (
                  <span className="flex items-center justify-center">
                    <CheckCircleIcon
                      className={`w-5 h-5 ${
                        calculateProfitLoss(trade) >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      } mr-1`}
                    />
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-blue-500 mr-1" />
                    Open
                  </span>
                )}
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTradeToDelete(trade);
                  }}
                  className="p-1 rounded mr-2"
                  title="Delete trade"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.tradingview.com/chart/?symbol=${trade.symbol}`,
                      '_blank',
                    );
                  }}
                  className="p-1 rounded mr-2"
                  title="View on TradingView"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://finviz.com/quote.ashx?t=${trade.symbol}`,
                      '_blank',
                    );
                  }}
                  className="p-1 rounded"
                  title="View on Finviz"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tradeToDelete && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this trade?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setTradeToDelete(null)}
                className="px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTrade(tradeToDelete.id ?? BigInt(0));
                  setTradeToDelete(null);
                }}
                className="px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(date: Date): string {
  return date
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(value));
}

function formatCreditDebit(value: number, tradeType: string): JSX.Element {
  const formattedValue = formatCurrency(value);
  const isShort = tradeType.toLowerCase().startsWith('short');

  if (isShort) {
    return value < 0 ? (
      <span className="text-red-500">({formattedValue})</span>
    ) : (
      <span className="text-green-600">{formattedValue}</span>
    );
  } else {
    return <span className="text-red-500">({formattedValue})</span>;
  }
}

function isExpirationWarning(expirationDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  return expirationDate <= threeDaysFromNow;
}

function calculateProfitLoss(trade: ITrade): number {
  const multiplier = trade.type.toLowerCase().startsWith('short') ? 1 : -1;
  return (
    multiplier * (trade.price - (trade.exitPrice ?? 0)) * trade.contracts * 100
  );
}

function calculatePercentage(trade: ITrade): number {
  const multiplier = trade.type.toLowerCase().startsWith('short') ? 1 : -1;
  return (
    multiplier * ((trade.price - (trade.exitPrice ?? 0)) / trade.price) * 100
  );
}

function formatTradeType(type: string): string {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case 'SHORT-PUT':
      return 'SPUT';
    case 'SHORT-CALL':
      return 'SCALL';
    default:
      return upperType;
  }
}

function getDaysToExpiration(expirationDate: Date): number {
  const today = new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateMinExitPrice(trade: ITrade): number {
  const isShort = trade.type.toLowerCase().startsWith('short');
  return isShort ? trade.price / 2 : trade.price * 2;
}

function TradeTypeIcon({ type }: { type: string }) {
  switch (type.toUpperCase()) {
    case 'SHORT-PUT':
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    case 'SHORT-CALL':
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    case 'LONG-PUT':
      return <ArrowTrendingDownIcon className="w-4 h-4 text-blue-500" />;
    case 'LONG-CALL':
      return <ArrowTrendingUpIcon className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
}

function calculateBreakeven(trade: ITrade): number {
  if (trade.type.toLowerCase() === 'short-put') {
    return trade.strike - trade.price;
  } else if (trade.type.toLowerCase() === 'short-call') {
    return trade.strike + trade.price;
  }
  return 0;
}
