'use client';

import { ITrade } from '../models';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';

export default function OptionTradeTable({
  trades,
  onDeleteTrade,
  onEditTrade,
}: {
  trades: ITrade[];
  onDeleteTrade: (id: number) => void;
  onEditTrade: (trade: ITrade) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border p-2">Type</th>
          <th className="border p-2">Symbol</th>
          <th className="border p-2">Strike</th>
          <th className="border p-2">Price</th>
          <th className="border p-2">Expiration</th>
          <th className="border p-2">Contracts</th>
          <th className="border p-2">Credit/Debit</th>
          <th className="border p-2">Exit Price</th>
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
            className={`cursor-pointer hover:bg-gray-200 transition-colors duration-150 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <td className="border p-2 text-center">
              {formatTradeType(trade.type)}
            </td>
            <td className="border p-2 text-center">{trade.symbol}</td>
            <td className="border p-2 text-right">
              {formatCurrency(trade.strike)}
            </td>
            <td className="border p-2 text-right">
              {formatCurrency(trade.price)}
            </td>
            <td className="border p-2 text-right">
              <div className="flex items-center justify-end">
                <span>{formatDate(trade.expirationDate)}</span>
                {isExpirationWarning(trade.expirationDate) && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 ml-1" />
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
              {trade.exitPrice ? formatCurrency(trade.exitPrice) : ''}
            </td>
            <td className="border p-2 text-right">
              {trade.exitPrice ? (
                <div className="flex flex-col items-end">
                  {formatCreditDebit(calculateProfitLoss(trade), trade.type)}
                  <span
                    className={`text-xs ${
                      calculateProfitLoss(trade) >= 0
                        ? 'text-green-600'
                        : 'text-red-500'
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
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-1" />
                  Closed
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
                  onDeleteTrade(trade.id ?? 0);
                }}
                className="text-red-500 hover:text-red-700 p-1 rounded mr-2"
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
                className="text-blue-500 hover:text-blue-700 p-1 rounded"
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
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
  return multiplier * (trade.price - (trade.exitPrice ?? 0)) * trade.contracts * 100;
}

function calculatePercentage(trade: ITrade): number {
  const multiplier = trade.type.toLowerCase().startsWith('short') ? 1 : -1;
  return multiplier * ((trade.price - (trade.exitPrice ?? 0)) / trade.price) * 100;
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
