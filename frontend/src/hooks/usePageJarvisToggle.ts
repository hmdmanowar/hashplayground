import { useEffect } from "react";
import { useSetPageJarvisToggle } from "../context/PageHeaderContext";

// Registers a local toggle the Navbar's Jarvis button calls instead of
// navigating to /jarvis while this page is mounted (see Playground.tsx).
// `toggle` is wrapped in a function updater — passing the callback directly
// to setState would make React treat it as a state updater instead of the
// value itself.
export function usePageJarvisToggle(toggle: () => void) {
  const setJarvisToggle = useSetPageJarvisToggle();

  useEffect(() => {
    setJarvisToggle(() => toggle);
    return () => setJarvisToggle(null);
  });
}
