import React, { useState } from 'react';

export default function DateFilter({ onChange }) {
  const [preset, setPreset] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePreset = (type) => {
    setPreset(type);
    const now = new Date();
    let start, end = now;

    if (type === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (type === 'yesterday') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    } else if (type === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }

    if (type !== 'custom') {
      onChange({ start, end });
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onChange({
        start: new Date(customStart),
        end: new Date(customEnd),
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm w-full">
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        {['today', 'yesterday', '7days', 'custom'].map((item) => (
          <button
            key={item}
            onClick={() => handlePreset(item)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              preset === item
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {item === '7days' ? 'Last 7 Days' : item}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-end gap-3 w-full md:w-auto mt-2 md:mt-0 animate-fadeIn">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
