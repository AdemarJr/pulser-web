"use client";

import { createContext, useContext } from "react";

type MobileNavContextValue = {
  openMenu: () => void;
};

export const MobileNavContext = createContext<MobileNavContextValue>({
  openMenu: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}
