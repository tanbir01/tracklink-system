import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext({
  provider: 'openstreetmap',
  setProvider: () => {},
});

export function MapProvider({ children }) {
  // Read initial map provider from settings or default to openstreetmap
  const [provider, setProvider] = useState(() => {
    const saved = localStorage.getItem('map_provider');
    return saved || import.meta.env.VITE_MAP_PROVIDER || 'openstreetmap';
  });

  const changeProvider = (newProvider) => {
    setProvider(newProvider);
    localStorage.setItem('map_provider', newProvider);
  };

  return (
    <MapContext.Provider value={{ provider, setProvider: changeProvider }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapProvider() {
  return useContext(MapContext);
}
