import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useMapProvider } from '../components/map/MapProvider';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Bell, Lock, Shield, Eye, EyeOff, Save, KeyRound } from 'lucide-react';

export default function Settings() {
  const { provider, setProvider } = useMapProvider();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings states
  const [updateInterval, setUpdateInterval] = useState(10);
  const [batteryOptimization, setBatteryOptimization] = useState(true);
  const [notifyLowBattery, setNotifyLowBattery] = useState(true);
  const [notifyDeviceOffline, setNotifyDeviceOffline] = useState(true);
  const [notifyDeviceOnline, setNotifyDeviceOnline] = useState(true);
  const [notifyGeofenceEnter, setNotifyGeofenceEnter] = useState(true);
  const [notifyGeofenceExit, setNotifyGeofenceExit] = useState(true);
  const [notifyDeviceRestart, setNotifyDeviceRestart] = useState(true);
  const [notifySimChanged, setNotifySimChanged] = useState(true);
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const [showPass, setShowPass] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setUpdateInterval(data.update_interval);
      setBatteryOptimization(data.battery_optimization);
      setNotifyLowBattery(data.notify_low_battery);
      setNotifyDeviceOffline(data.notify_device_offline);
      setNotifyDeviceOnline(data.notify_device_online);
      setNotifyGeofenceEnter(data.notify_geofence_enter);
      setNotifyGeofenceExit(data.notify_geofence_exit);
      setNotifyDeviceRestart(data.notify_device_restart);
      setNotifySimChanged(data.notify_sim_changed);
      
      // Update local storage/context providers
      if (data.map_provider) setProvider(data.map_provider);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load user preferences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        update_interval: Number(updateInterval),
        battery_optimization: batteryOptimization,
        notify_low_battery: notifyLowBattery,
        notify_device_offline: notifyDeviceOffline,
        notify_device_online: notifyDeviceOnline,
        notify_geofence_enter: notifyGeofenceEnter,
        notify_geofence_exit: notifyGeofenceExit,
        notify_device_restart: notifyDeviceRestart,
        notify_sim_changed: notifySimChanged,
        map_provider: provider,
        theme: theme
      };

      await api.put('/settings', payload);
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassSubmitting(true);

    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPassSuccess('Password changed successfully! You will need to re-login with your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(''), 6000);
    } catch (err) {
      setPassError(err?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPassSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking user configurations..." fullScreen />;
  }

  const selectToggles = [
    { label: "Low Battery Alert", state: notifyLowBattery, set: setNotifyLowBattery },
    { label: "Phone Offline Alert", state: notifyDeviceOffline, set: setNotifyDeviceOffline },
    { label: "Phone Online Alert", state: notifyDeviceOnline, set: setNotifyDeviceOnline },
    { label: "Geofence Enter Alert", state: notifyGeofenceEnter, set: setNotifyGeofenceEnter },
    { label: "Geofence Exit Alert", state: notifyGeofenceExit, set: setNotifyGeofenceExit },
    { label: "Device Restarted Alert", state: notifyDeviceRestart, set: setNotifyDeviceRestart },
    { label: "SIM Changed Alert", state: notifySimChanged, set: setNotifySimChanged }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans pb-12">
      
      {/* Settings inputs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2.5">
            <SettingsIcon className="w-5.5 h-5.5 text-primary-500" /> Preferences & Config
          </h2>

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl mb-6">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold rounded-2xl mb-6">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            
            {/* Tracking intervals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400">Tracking GPS Update Interval</label>
                <select
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500"
                >
                  <option value={5}>5 Seconds (High resolution)</option>
                  <option value={10}>10 Seconds (Normal)</option>
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds (Battery efficient)</option>
                  <option value={60}>60 Seconds</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400">Default Map Engine Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500"
                >
                  <option value="openstreetmap">OpenStreetMap (Default, free)</option>
                  <option value="googlemaps">Google Maps (Future module)</option>
                </select>
              </div>
            </div>

            {/* Battery optimizations toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/20">
              <div className="space-y-1 pr-4">
                <h5 className="font-bold text-slate-800 dark:text-slate-200">Device Battery Optimization</h5>
                <p className="text-[10px] text-slate-400">Instruct Android client tracker to pause service coordinates dispatch when stationary or battery falls below threshold.</p>
              </div>
              <button
                type="button"
                onClick={() => setBatteryOptimization(!batteryOptimization)}
                className={`h-6 w-11 rounded-full shrink-0 relative transition-all duration-300 ${
                  batteryOptimization ? 'bg-primary-500' : 'bg-slate-350 dark:bg-slate-700'
                }`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-all duration-300 ${
                  batteryOptimization ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Notification alert preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Bell className="w-4.5 h-4.5 text-primary-500" /> Push Alarm Notification Toggles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectToggles.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => item.set(!item.state)}
                      className={`h-5 w-9 rounded-full relative transition-all duration-300 ${
                        item.state ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-300 ${
                        item.state ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save trigger */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/10 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" /> {submitting ? 'Saving settings...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Sidebar Profile details & password changes */}
      <div className="space-y-6">
        
        {/* Theme select */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" /> Interface Customization
          </h3>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Dark Mode Interface</span>
            <button
              onClick={toggleTheme}
              className={`h-5 w-9 rounded-full relative transition-all duration-300 ${
                theme === 'dark' ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-300 ${
                theme === 'dark' ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Change password widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-500" /> Update Password
          </h3>

          {passSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-xl mb-4">
              {passSuccess}
            </div>
          )}
          {passError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] font-semibold rounded-xl mb-4">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passSubmitting}
              className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-750 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              {passSubmitting ? 'Updating password...' : 'Update Password'}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
