import React, { useState } from 'react';
import { useDevices } from '../hooks/useDevices';
import DeviceList from '../components/devices/DeviceList';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Trash2, Edit3, Smartphone, Laptop, Settings, CreditCard } from 'lucide-react';

export default function Devices() {
  const { devices, loading, addDevice, editDevice, removeDevice } = useDevices();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Form states
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [androidVersion, setAndroidVersion] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDeviceId('');
    setName('My Tracker Phone');
    setModel('');
    setManufacturer('');
    setAndroidVersion('');
    setError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await addDevice({
        device_id: deviceId,
        name,
        model,
        manufacturer,
        android_version: androidVersion
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to register device.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await editDevice(editingDevice.id, {
        name,
        model,
        manufacturer,
        android_version: androidVersion
      });
      setIsEditOpen(false);
      setEditingDevice(null);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update device details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (dev) => {
    setEditingDevice(dev);
    setName(dev.name);
    setModel(dev.model || '');
    setManufacturer(dev.manufacturer || '');
    setAndroidVersion(dev.android_version || '');
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this device? All location telemetry and history for this device will be permanently deleted.")) {
      try {
        await removeDevice(id);
      } catch (err) {
        alert("Failed to remove device.");
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving tracked fleet..." fullScreen />;
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Page Title & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Devices Fleet</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and register authorized GPS tracking hardware.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary-500/10 active:scale-95 transition-all duration-200"
        >
          <Plus className="w-4.5 h-4.5" /> Register Tracker Device
        </button>
      </div>

      {/* Devices table & cards */}
      {devices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto">
          <Smartphone className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Devices Registered Yet</h3>
          <p className="text-sm text-slate-400 mb-6">Start by adding your personal smartphone. You'll receive a unique Device ID to configure in the Android tracker application.</p>
          <button
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10"
          >
            Register Your First Device
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-4">Device Name</th>
                <th className="py-4 px-4">Device ID (String)</th>
                <th className="py-4 px-4">Model & Manufacturer</th>
                <th className="py-4 px-4">Android version</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{dev.name}</td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{dev.device_id}</td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                    {dev.manufacturer} {dev.model}
                  </td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                    {dev.android_version ? `Android ${dev.android_version}` : 'N/A'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      dev.is_online
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {dev.is_online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(dev)}
                        title="Edit Details"
                        className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dev.id)}
                        title="Delete Device"
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Device Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Tracker Device">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Device ID (Unique String)</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. android-imei-or-uuid"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <span className="block text-[9px] text-slate-400">Specify a unique identifier string. You must insert the exact matching string in the Android client application settings.</span>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Device Name (Alias)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Galaxy S24"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Samsung"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. SM-G998B"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Android Version (Optional)</label>
            <input
              type="text"
              value={androidVersion}
              onChange={(e) => setAndroidVersion(e.target.value)}
              placeholder="e.g. 14"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Device Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingDevice(null); }} title="Modify Device Details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Device Name (Alias)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Android Version (Optional)</label>
            <input
              type="text"
              value={androidVersion}
              onChange={(e) => setAndroidVersion(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsEditOpen(false); setEditingDevice(null); }}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
