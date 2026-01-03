import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type ViewMode = 'superadmin' | 'admin';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  canSwitchView: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const canSwitchView = role === 'superadmin';
  
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('superadmin_view_mode');
      if (stored === 'admin' || stored === 'superadmin') {
        return stored;
      }
    }
    return 'superadmin';
  });

  const setViewMode = (mode: ViewMode) => {
    if (canSwitchView) {
      setViewModeState(mode);
      localStorage.setItem('superadmin_view_mode', mode);
    }
  };

  // Reset to superadmin view if user is not a superadmin
  useEffect(() => {
    if (!canSwitchView && viewMode !== 'superadmin') {
      setViewModeState('superadmin');
      localStorage.removeItem('superadmin_view_mode');
    }
  }, [canSwitchView, viewMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, canSwitchView }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
