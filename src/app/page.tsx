'use client';

import { useState, useCallback, useEffect } from 'react';
import OptionTradeTable from './components/OptionTradeTable';
import AddTradeForm from './components/AddTradeForm';
import { ITrade } from './models';
import {
  addTrade,
  updateTrade,
  deleteTrade,
  getAllTrades,
} from './services/database.service';

export default function Home() {
  const [trades, setTrades] = useState<ITrade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<ITrade | undefined>();

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    const loadedTrades = await getAllTrades();
    setTrades(loadedTrades);
  };

  const addOrUpdateTrade = async (trade: ITrade) => {
    if (editingTrade) {
      await updateTrade(editingTrade.id as bigint, trade);
    } else {
      await addTrade(trade);
    }
    await loadTrades();
    setIsModalOpen(false);
    setEditingTrade(undefined);
  };

  const handleDeleteTrade = async (id: number) => {
    await deleteTrade(id);
    await loadTrades();
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTrade(undefined);
  }, []);

  const editTrade = (trade: ITrade): void => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Options Trade Tracker</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add New Trade
        </button>
        <OptionTradeTable
          trades={trades}
          onDeleteTrade={handleDeleteTrade}
          onEditTrade={editTrade}
        />
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full"
            onClick={closeModal}
          >
            <div
              className="relative top-20 mx-auto p-5 border w-96 md:w-[32rem] shadow-lg rounded-md bg-white dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">
                  {editingTrade ? 'Edit Trade' : 'Add New Trade'}
                </h2>
                <button
                  onClick={closeModal}
                  className="hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <AddTradeForm
                onAddTrade={addOrUpdateTrade}
                existingTrade={editingTrade}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
