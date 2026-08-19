import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ui-mode";
const UiModeContext = createContext(null);

function readStoredMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "w3c" ? "w3c" : "design";
  } catch {
    return "design";
  }
}

export function UiModeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable: mode still applies for this session */
    }
  }, [mode]);

  const toggle = () => setMode((m) => (m === "design" ? "w3c" : "design"));

  return (
    <UiModeContext.Provider value={{ mode, isW3c: mode === "w3c", toggle }}>
      {children}
    </UiModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUiMode() {
  const ctx = useContext(UiModeContext);
  if (!ctx) throw new Error("useUiMode must be used within UiModeProvider");
  return ctx;
}