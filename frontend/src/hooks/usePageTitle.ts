import { useEffect, type ReactNode } from "react";
import { useSetPageTitle, useSetPageTitleSuffix } from "../context/PageHeaderContext";

export function usePageTitle(title: string | null, suffix: ReactNode = null) {
  const setTitle = useSetPageTitle();
  const setSuffix = useSetPageTitleSuffix();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  });

  useEffect(() => {
    setSuffix(suffix);
    return () => setSuffix(null);
  });
}
