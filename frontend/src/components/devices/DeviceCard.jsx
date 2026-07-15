import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Battery, Compass, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export default function DeviceCard({ device, latestLocation, latestStatus }) {
  const isOnline = device.is_online;
  const batteryPct = latestStatus?.battery_percent ?? 100;

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-950/20 text-primary-500">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white leading-tight">
              {device.name}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {device.manufacturer} {device.model}
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isOnline
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800/80 py-4 my-4 text-xs">
        <div className="flex items-center gap-2">
          <Battery className={`w-4 h-4 ${batteryPct <= 20 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Battery</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 mt-1 block">
              {batteryPct}% {latestStatus?.is_charging ? '+' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-slate-400" />
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Speed</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 mt-1 block">
              {latestLocation ? `${Math.round((latestLocation.speed || 0) * 3.6)} km/h` : '0 km/h'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs mt-2">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {device.last_seen ? `Seen ${formatRelativeTime(device.last_seen)}` : 'Never seen'}
        </span>

        <Link
          to={`/devices/${device.id}`}
          className="text-primary-500 hover:text-primary-600 font-bold transition-colors"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
}
