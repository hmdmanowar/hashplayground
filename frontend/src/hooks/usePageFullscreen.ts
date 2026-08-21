import { useEffect } from "react";
import { useSetPageFullscreen } from "../context/PageHeaderContext";

export function usePageFullscreen(fullscreen: boolean) {
  const setFullscreen = useSetPageFullscreen();

  useEffect(() => {
    setFullscreen(fullscreen);
    return () => setFullscreen(false);
  });
}
