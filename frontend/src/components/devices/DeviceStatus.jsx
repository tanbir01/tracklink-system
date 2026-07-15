import React from 'react';
import { ShieldAlert, Cpu, Wifi, Radio, Battery, Smartphone, Hash } from 'lucide-react';

export default function DeviceStatus({ device, latestStatus }) {
  const specs = [
    {
      label: "Device ID",
      value: device.device_id,
      icon: Hash
    },
    {
      label: "OS Version",
      value: device.android_version ? `Android ${device.android_version}` : 'Unknown',
      icon: Cpu
    },
    {
      label: "Network Connection",
      value: latestStatus?.wifi_connected 
        ? 'Wi-Fi' 
        : latestStatus?.mobile_data 
        ? `Mobile Data (${latestStatus.connection_type || 'Cellular'})` 
        : 'Offline',
      icon: latestStatus?.wifi_connected ? Wifi : Radio
    },
    {
      label: "Battery State",
      value: latestStatus 
        ? `${latestStatus.battery_percent}% ${latestStatus.is_charging ? '(Charging)' : '(Discharging)'}`
        : 'Unknown',
      icon: Battery
    },
    {
      label: "Carrier",
      value: latestStatus?.network_operator || 'Unknown',
      icon: Radio
    },
    {
      label: "Hardware Info",
      value: `${device.manufacturer || ''} ${device.model || ''}`.trim() || 'Unknown',
      icon: Smartphone
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-primary-500" /> Device System Specs
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {specs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <div key={index} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800/20">
              <div className="p-3 bg-white dark:bg-slate-800 text-primary-500 rounded-xl shadow-xs">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">
                  {spec.label}
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1.5 block">
                  {spec.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
