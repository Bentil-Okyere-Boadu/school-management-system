'use client';

import { User } from '@/@types';
import { useGetRoles } from '@/hooks/auth';
import { initializeRoles } from '@/utils/roles';
import { createContext, useContext, useEffect, useState } from 'react';

type AppContextType = {
  roles: {id: string, name: string}[];
  isLoading: boolean;
  error: Error | null;
  loggedInUser: User | null;
  setLoggedInUser: (user: User) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [state, setState] = useState<{
    roles: {id: string, name: string}[];
    isLoading: boolean;
    error: Error | null;
  }>({
    roles: [],
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

  const contextValue = {
    ...state,
    loggedInUser,
    setLoggedInUser,
  };

  return (
    <AppContext.Provider value={contextValue}>
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