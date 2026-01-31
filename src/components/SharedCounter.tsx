import React from 'react';
import { CounterAction } from '../types';
import { formatTimestamp } from '../utils/helpers';
import { Plus, Minus, Hash } from 'lucide-react';

interface SharedCounterProps {
  counter: number;
  lastAction: CounterAction | null;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const SharedCounter: React.FC<SharedCounterProps> = ({
  counter,
  lastAction,
  onIncrement,
  onDecrement
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shared Counter
        </h2>
      </div>

      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
          {counter}
        </div>
        
        {lastAction && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last action by <span className="font-medium">{lastAction.userName}</span>
            <span className="mx-1">•</span>
            {formatTimestamp(lastAction.timestamp)}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onDecrement}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg active:scale-95"
        >
          <Minus className="w-5 h-5" />
          Decrement
        </button>
        
        <button
          onClick={onIncrement}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Increment
        </button>
      </div>
    </div>
  );
};
