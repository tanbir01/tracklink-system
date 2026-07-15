import React, { useEffect, useState } from 'react';
import { useDevices } from '../hooks/useDevices';
import { useWebSocket } from '../hooks/useWebSocket';
import { getAlerts, markAlertRead, deleteAlert } from '../api/alerts';
import StatCard from '../components/common/StatCard';
import AlertList from '../components/alerts/AlertList';
import DeviceList from '../components/devices/DeviceList';
import MapContainer from '../components/map/MapContainer';
import DeviceMarker from '../components/map/DeviceMarker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Smartphone, ShieldAlert, Wifi, BatteryCharging, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { devices, loading: devicesLoading, fetchDevices } = useDevices();
  const { lastMessage, deviceLocations: wsLocations } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, lowBattery: 0 });
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [deviceLocations, setDeviceLocations] = useState({});

  // Fetch initial alerts
  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true);
      const data = await getAlerts({ limit: 5 });
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Update statistics whenever devices, locations, or statuses change
  useEffect(() => {
    if (devices.length === 0) return;

    let online = 0;
    let offline = 0;
    let lowBattery = 0;

    devices.forEach(dev => {
      const devLoc = wsLocations[dev.id] || deviceLocations[dev.id] || null;
      // We assume device is online based on backend flag or last seen
      if (dev.is_online) {
        online += 1;
      } else {
        offline += 1;
      }

      // Check battery level
      const status = deviceStatuses[dev.id];
      if (status && status.battery_percent <= 20) {
        lowBattery += 1;
      }
    });

    setStats({
      total: devices.length,
      online,
      offline,
      lowBattery
    });
  }, [devices, deviceLocations, deviceStatuses, wsLocations]);

  // Handle incoming websocket messages for real-time dashboard updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'alert') {
      setAlerts(prev => [lastMessage.data, ...prev].slice(0, 5));
    } else if (lastMessage.type === 'device_status') {
      const status = lastMessage.data;
      setDeviceStatuses(prev => ({
        ...prev,
        [status.device_id]: status
      }));
    } else if (lastMessage.type === 'location_update') {
      const loc = lastMessage.data;
      setDeviceLocations(prev => ({
        ...prev,
        [loc.device_id]: loc
      }));
    }
  }, [lastMessage]);

  const handleMarkRead = async (id) => {
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (devicesLoading && alertsLoading) {
    return <LoadingSpinner message="Assembling your dashboard..." fullScreen />;
  }

  // Get active coordinates for mini map
  const activeLocationsList = Object.values({ ...deviceLocations, ...wsLocations });
  const mapCenter = activeLocationsList.length > 0 
    ? [activeLocationsList[0].latitude, activeLocationsList[0].longitude] 
    : [23.8103, 90.4125];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">System Monitor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time status overview of all authorized tracking units.</p>
        </div>
        <button 
          onClick={() => { fetchDevices(); fetchAlerts(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-all duration-200 active:scale-95 w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registered Devices" 
          value={stats.total} 
          icon={Smartphone} 
          colorClass="text-primary-500 bg-primary-500/10"
        />
        <StatCard 
          title="Online Tracker Units" 
          value={stats.online} 
          icon={Wifi} 
          colorClass="text-emerald-500 bg-emerald-500/10"
          trend={`${stats.total ? Math.round((stats.online / stats.total) * 100) : 0}%`}
          description="Operational rate"
        />
        <StatCard 
          title="Offline Tracker Units" 
          value={stats.offline} 
          icon={AlertCircle} 
          colorClass="text-rose-500 bg-rose-500/10"
        />
        <StatCard 
          title="Low Battery Alerts" 
          value={stats.lowBattery} 
          icon={ShieldAlert} 
          colorClass="text-amber-500 bg-amber-500/10"
          trend={stats.lowBattery > 0 ? "Needs charge" : "Normal state"}
        />
      </div>

      {/* Grid Layout: Map & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map widget */}
        <div className="lg:col-span-2 flex flex-col h-[400px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Live Location Overview</h3>
          <div className="flex-1 rounded-2xl overflow-hidden min-h-0">
            <MapContainer center={mapCenter} zoom={devices.length > 1 ? 5 : 12}>
              {devices.map(device => {
                const loc = wsLocations[device.id] || deviceLocations[device.id];
                const status = deviceStatuses[device.id];
                return (
                  <DeviceMarker 
                    key={device.id} 
                    device={device} 
                    location={loc} 
                    status={status} 
                  />
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Alerts feed */}
        <div className="flex flex-col h-[400px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent Alerts</h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <AlertList 
              alerts={alerts} 
              onMarkRead={handleMarkRead} 
              onDelete={handleDeleteAlert} 
            />
          </div>
        </div>
      </div>

      {/* Device grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Active Device Fleet</h3>
        <DeviceList 
          devices={devices} 
          latestLocations={{ ...deviceLocations, ...wsLocations }} 
          latestStatuses={deviceStatuses} 
        />
      </div>
    </div>
  );
}
