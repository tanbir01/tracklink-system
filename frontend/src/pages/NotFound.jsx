import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Smartphone } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 text-center max-w-md p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl mx-4">
        <div className="inline-flex p-4 rounded-3xl bg-primary-500/10 text-primary-500 border border-primary-500/20 mb-6 shadow-inner">
          <HelpCircle className="w-10 h-10" />
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-200 tracking-tight mb-4">Location Lost</h2>
        <p className="text-slate-400 text-xs mb-8">The coordinate address or dashboard resource you are looking for has wandered out of coverage.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
        >
          Return to Monitor Dashboard
        </Link>
      </div>
    </div>
  );
}
