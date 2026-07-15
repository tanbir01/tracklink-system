import React from 'react';
import AlertItem from './AlertItem';
import { BellOff } from 'lucide-react';

export default function AlertList({ alerts, onMarkRead, onDelete }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
        <BellOff className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h4 className="font-bold text-slate-800 dark:text-white mb-1">All Quiet Here</h4>
        <p className="text-sm text-slate-400">No alerts found or generated recently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
