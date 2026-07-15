import React, { useState } from 'react';
import DeviceCard from './DeviceCard';
import { Search, Smartphone } from 'lucide-react';

export default function DeviceList({ devices, latestLocations = {}, latestStatuses = {} }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = devices.filter(dev => 
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dev.model && dev.model.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-sm w-full max-w-md">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-slate-800 dark:text-white focus:outline-none w-full text-sm"
        />
      </div>

      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-white mb-1">No Devices Found</h4>
          <p className="text-sm text-slate-400">Try checking your search criteria or register a new device.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              latestLocation={latestLocations[device.id]}
              latestStatus={latestStatuses[device.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
