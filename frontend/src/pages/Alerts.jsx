import React, { useEffect, useState } from 'react';
import { getAlerts, markAlertRead, markAllAlertsRead, deleteAlert, deleteReadAlerts } from '../api/alerts';
import { useDevices } from '../hooks/useDevices';
import AlertList from '../components/alerts/AlertList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, CheckSquare, Trash2, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function Alerts() {
  const { devices, loading: devicesLoading } = useDevices();
  const { lastMessage } = useWebSocket();

  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState(''); // '', 'true', 'false'
  const [filterDevice, setFilterDevice] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit
      };
      if (filterType) params.type = filterType;
      if (filterRead !== '') params.is_read = filterRead === 'true';
      if (filterDevice) params.device_id = filterDevice;

      const data = await getAlerts(params);
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [page, filterType, filterRead, filterDevice]);

  // Capture real-time alerts from websocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'alert') {
      const alert = lastMessage.data;
      setAlerts(prev => [alert, ...prev]);
      setTotal(prev => prev + 1);
      setUnreadCount(prev => prev + 1);
    }
  }, [lastMessage]);

  const handleMarkRead = async (id) => {
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRead = async () => {
    if (window.confirm("Are you sure you want to clear all read alerts from log history?")) {
      try {
        await deleteReadAlerts();
        setAlerts(prev => prev.filter(a => !a.is_read));
        fetchAlertsData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (devicesLoading && loading) {
    return <LoadingSpinner message="Querying security feeds..." fullScreen />;
  }

  const alertTypes = [
    { value: 'low_battery', label: 'Low Battery' },
    { value: 'device_offline', label: 'Device Offline' },
    { value: 'device_online', label: 'Device Online' },
    { value: 'geofence_enter', label: 'Geofence Enter' },
    { value: 'geofence_exit', label: 'Geofence Exit' },
    { value: 'device_restart', label: 'Device Restart' },
    { value: 'sim_changed', label: 'SIM Changed' },
    { value: 'speed_alert', label: 'Speed Alert' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Bulk Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            Alert Logs {unreadCount > 0 && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} unread</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review security notices, geofence violations, and system battery alarms.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckSquare className="w-4 h-4" /> Mark All Read
          </button>
          <button
            onClick={handleDeleteRead}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/10 hover:bg-rose-100/60 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" /> Clear Read Logs
          </button>
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-wrap gap-4 items-center">
        <SlidersHorizontal className="w-5 h-5 text-slate-400 shrink-0" />
        
        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
        >
          <option value="">All Alert Types</option>
          {alertTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Read Filter */}
        <select
          value={filterRead}
          onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="false">Unread Only</option>
          <option value="true">Read Only</option>
        </select>

        {/* Device Filter */}
        <select
          value={filterDevice}
          onChange={(e) => { setFilterDevice(e.target.value); setPage(1); }}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
        >
          <option value="">All Devices</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <button 
          onClick={fetchAlertsData}
          className="ml-auto p-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
          title="Refresh Feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alerts feed */}
      {loading ? (
        <LoadingSpinner message="Querying alert feeds..." />
      ) : (
        <AlertList
          alerts={alerts}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination controls */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
