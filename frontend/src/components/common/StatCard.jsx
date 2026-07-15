import React from 'react';

export default function StatCard({ title, value, icon: Icon, colorClass = "text-primary-500", trend, description }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-950/20 rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
          <h3 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white mt-1">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${colorClass}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
          {description && (
            <span className="text-slate-400 dark:text-slate-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
