import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon, comparison, className }) {
  const isPrimitive = (v) => typeof v === 'string' || typeof v === 'number';
  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-md border border-gray-200", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-lg font-medium text-gray-600">
          {isPrimitive(title) ? title : title}
        </div>
        <div className="text-2xl text-indigo-600">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">
        {isPrimitive(value) ? value : value}
      </div>
      {comparison && (
        <div className="text-sm text-gray-500">{isPrimitive(comparison) ? comparison : comparison}</div>
      )}
    </div>
  );
}
