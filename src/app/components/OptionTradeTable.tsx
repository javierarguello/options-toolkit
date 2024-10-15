'use client';

import { ITrade } from '../models';

export default function OptionTradeTable({
  trades,
  onDeleteTrade,
}: {
  trades: ITrade[];
  onDeleteTrade: (id: number) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border p-2">Symbol</th>
          <th className="border p-2">Strike</th>
          <th className="border p-2">Price</th>
          <th className="border p-2">Expiration Date</th>
          <th className="border p-2">Contracts</th>
          <th className="border p-2">Exit Price</th>
          <th className="border p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((trade: ITrade) => (
          <tr key={trade.id}>
            <td className="border p-2 text-center">{trade.symbol}</td>
            <td className="border p-2 text-right">
              {formatCurrency(trade.strike)}
            </td>
            <td className="border p-2 text-right">
              {formatCurrency(trade.price)}
            </td>
            <td className="border p-2 text-right">
              {formatDate(trade.expirationDate)}
            </td>
            <td className="border p-2 text-right">{trade.contracts}</td>
            <td className="border p-2 text-right">
              {trade.exitPrice ? formatCurrency(trade.exitPrice) : ''}
            </td>
            <td className="border p-2 text-right">
              <button
                onClick={() => onDeleteTrade(trade.id ?? 0)}
                className="bg-red-500 text-white p-1 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
