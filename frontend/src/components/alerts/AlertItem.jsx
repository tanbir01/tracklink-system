import React from 'react';
import { Trash2, CheckCircle2, AlertTriangle, Info, BellRing } from 'lucide-react';
import AlertBadge from './AlertBadge';
import { formatDateTime } from '../../utils/formatters';

export default function AlertItem({ alert, onMarkRead, onDelete }) {
  const getIcon = (type) => {
    switch (type) {
      case 'device_offline':
      case 'low_battery':
      case 'sim_changed':
      case 'speed_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'device_online':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'geofence_enter':
      case 'geofence_exit':
        return <BellRing className="w-5 h-5 text-primary-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className={`flex items-start justify-between p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl transition-all duration-300 ${
      alert.is_read 
        ? 'bg-white dark:bg-slate-900 opacity-70' 
        : 'bg-primary-50/20 dark:bg-primary-950/5 border-l-4 border-l-primary-500 bg-white dark:bg-slate-900 shadow-xs'
    }`}>
      <div className="flex gap-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800`}>
          {getIcon(alert.type)}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-bold text-sm text-slate-800 dark:text-white">{alert.title}</h5>
            <AlertBadge type={alert.type} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{alert.message}</p>
          <span className="block text-[10px] text-slate-400 font-medium">
            {formatDateTime(alert.created_at)}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 ml-4">
        {!alert.is_read && (
          <button
            onClick={() => onMarkRead(alert.id)}
            title="Mark as Read"
            className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(alert.id)}
          title="Delete Alert"
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
