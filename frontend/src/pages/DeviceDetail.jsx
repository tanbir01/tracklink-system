import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDevice } from '../hooks/useDevices';
import { getLatestLocation, getLocationHistory } from '../api/locations';
import api from '../api/axios';
import DeviceStatus from '../components/devices/DeviceStatus';
import BatteryChart from '../components/charts/BatteryChart';
import SpeedChart from '../components/charts/SpeedChart';
import ActivityChart from '../components/charts/ActivityChart';
import MapContainer from '../components/map/MapContainer';
import DeviceMarker from '../components/map/DeviceMarker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, Clock, Battery, Wifi, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export default function DeviceDetail() {
  const { id } = useParams();
  const { device, loading: deviceLoading, error: deviceError, refetch } = useDevice(id);

  const [latestLocation, setLatestLocation] = useState(null);
  const [latestStatus, setLatestStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const fetchExtras = async () => {
    if (!id) return;
    try {
      setLoadingExtras(true);
      
      // Get latest location
      try {
        const loc = await getLatestLocation(id);
        setLatestLocation(loc);
      } catch (e) {
        console.log("No location registered yet.");
      }

      // Get latest status
      try {
        const { data } = await api.get(`/devices/${id}/status`);
        setLatestStatus(data);
      } catch (e) {
        console.log("No status registered yet.");
      }

      // Get recent locations list for charts
      try {
        const histData = await getLocationHistory(id, { limit: 100 });
        setHistory(histData.locations || []);
      } catch (e) {
        console.log("No history yet.");
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExtras(false);
    }
  };

  useEffect(() => {
    fetchExtras();
  }, [id]);

  if (deviceLoading || loadingExtras) {
    return <LoadingSpinner message="Diagnosing device..." fullScreen />;
  }

  if (deviceError || !device) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto font-sans mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Device Not Found</h4>
        <p className="text-sm text-slate-400 mb-6">The requested tracking unit could not be located or you lack permissions to view it.</p>
        <Link to="/devices" className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          Back to Fleet List
        </Link>
      </div>
    );
  }

  const mapCenter = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : [23.8103, 90.4125];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/devices"
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {device.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Registered ID: <span className="font-mono text-xs">{device.device_id}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => { refetch(); fetchExtras(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-colors active:scale-95 w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Telemetry
        </button>
      </div>

      {/* Grid: Map & System Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Mini map */}
        <div className="lg:col-span-2 flex flex-col h-[350px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Latest Registered Coordinates</h3>
          <div className="flex-1 rounded-2xl overflow-hidden min-h-0">
            {latestLocation ? (
              <MapContainer center={mapCenter} zoom={15}>
                <DeviceMarker device={device} location={latestLocation} status={latestStatus} />
              </MapContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-600 rounded-2xl font-semibold">
                No GPS location data logged yet
              </div>
            )}
          </div>
        </div>

        {/* System Specs status */}
        <DeviceStatus device={device} latestStatus={latestStatus} />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Battery usage line chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Battery className="w-5 h-5 text-primary-500" /> Battery Level Timeline
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">Last 100 records</span>
          </div>
          {history.length > 0 ? (
            <BatteryChart history={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 rounded-2xl">
              No historical battery data
            </div>
          )}
        </div>

        {/* Speed line chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" /> Speed Velocity Timeline
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">Last 100 records</span>
          </div>
          {history.length > 0 ? (
            <SpeedChart history={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 rounded-2xl">
              No historical speed data
            </div>
          )}
        </div>

        {/* Transmission Activity bar chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" /> Hourly Telemetry Activity
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">Updates registered by hour</span>
          </div>
          {history.length > 0 ? (
            <ActivityChart history={history} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 rounded-2xl">
              No activity logs recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
