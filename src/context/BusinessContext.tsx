'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { subscribeBusinessSettings } from '../services/businessService';
import { emptyBusiness, type BusinessSettings } from '../types/firestore';

const BusinessContext = createContext<BusinessSettings>(emptyBusiness);

/**
 * The operator's details from Ajustes. `initial` comes from the server so the first paint already has the
 * right name; afterwards the provider follows changes live.
 */
export function BusinessProvider({ initial, children }: { initial: BusinessSettings; children: ReactNode }) {
  const [business, setBusiness] = useState(initial);
  useEffect(() => subscribeBusinessSettings(setBusiness), []);
  return <BusinessContext.Provider value={business}>{children}</BusinessContext.Provider>;
}

export const useBusiness = () => useContext(BusinessContext);
