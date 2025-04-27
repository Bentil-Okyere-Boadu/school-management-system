'use client';

import { useGetRoles } from '@/hooks/auth';
import { initializeRoles } from '@/utils/roles';
import { createContext, useContext, useEffect, useState } from 'react';

type AppContextType = {
  roles: Record<string, string>;
  isLoading: boolean;
  error: Error | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    roles: Record<string, string>;
    isLoading: boolean;
    error: Error | null;
  }>({
    roles: {},
    isLoading: true,
    error: null,
  });

  const { roles, isLoading, error, isSuccess } = useGetRoles();
  useEffect(() => {
    setState({ roles: roles, isLoading: isLoading, error: error })
    if(isSuccess) {
      initializeRoles(roles);
    }
  }, [roles, isLoading, error, isSuccess]);

  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
}