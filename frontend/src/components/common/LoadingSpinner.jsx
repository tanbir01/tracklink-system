import React from 'react';

export default function LoadingSpinner({ message = "Loading...", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-12 h-12">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-950/20 rounded-full" />
        {/* Spinning Segment */}
        <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin" />
      </div>
      {message && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="py-12 w-full flex items-center justify-center">{content}</div>;
}
