import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { mockLocations, type Location } from "@/data";

interface ActiveLocationContextValue {
  activeLocation: Location;
  setActiveLocation: (id: string) => void;
}

const ActiveLocationContext = createContext<ActiveLocationContextValue | undefined>(undefined);

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationId] = useState("loc-002"); // De VeldKeur default

  const value = useMemo<ActiveLocationContextValue>(() => ({
    activeLocation: mockLocations.find((l) => l.id === locationId) ?? mockLocations[1],
    setActiveLocation: setLocationId,
  }), [locationId]);

  return (
    <ActiveLocationContext.Provider value={value}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation() {
  const ctx = useContext(ActiveLocationContext);
  if (!ctx) throw new Error("useActiveLocation must be used within ActiveLocationProvider");
  return ctx;
}
