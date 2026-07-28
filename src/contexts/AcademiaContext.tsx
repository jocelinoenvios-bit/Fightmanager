import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { Academia } from '@/types';
import { subscribeAcademia } from '@/services/academia';

type AcademiaContextValue = {
  academia: Academia | null;
  loading: boolean;
};

const AcademiaContext = createContext<AcademiaContextValue | undefined>(undefined);

export function AcademiaProvider({ children }: { children: React.ReactNode }) {
  const { academiaId } = useAuth();
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!academiaId) {
      setAcademia(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeAcademia(academiaId, (data) => {
      setAcademia(data);
      setLoading(false);
    });
    return unsub;
  }, [academiaId]);

  const value = useMemo(() => ({ academia, loading }), [academia, loading]);

  return <AcademiaContext.Provider value={value}>{children}</AcademiaContext.Provider>;
}

export function useAcademia() {
  const ctx = useContext(AcademiaContext);
  if (!ctx) throw new Error('useAcademia must be used within AcademiaProvider');
  return ctx;
}
