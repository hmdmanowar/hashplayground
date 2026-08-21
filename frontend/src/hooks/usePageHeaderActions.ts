import { useEffect, type ReactNode } from "react";
import { useSetPageHeaderActions } from "../context/PageHeaderContext";

export function usePageHeaderActions(actions: ReactNode) {
  const setActions = useSetPageHeaderActions();

  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
  });
}
