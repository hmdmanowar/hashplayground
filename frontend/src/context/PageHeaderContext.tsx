import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const PageHeaderActionsContext = createContext<ReactNode>(null);
const SetPageHeaderActionsContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(
  null,
);
const PageTitleContext = createContext<string | null>(null);
const SetPageTitleContext = createContext<Dispatch<SetStateAction<string | null>> | null>(null);
const PageTitleSuffixContext = createContext<ReactNode>(null);
const SetPageTitleSuffixContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null);
const PageFullscreenContext = createContext(false);
const SetPageFullscreenContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [titleSuffix, setTitleSuffix] = useState<ReactNode>(null);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <SetPageHeaderActionsContext.Provider value={setActions}>
      <SetPageTitleContext.Provider value={setTitle}>
        <SetPageTitleSuffixContext.Provider value={setTitleSuffix}>
          <SetPageFullscreenContext.Provider value={setFullscreen}>
            <PageHeaderActionsContext.Provider value={actions}>
              <PageTitleContext.Provider value={title}>
                <PageTitleSuffixContext.Provider value={titleSuffix}>
                  <PageFullscreenContext.Provider value={fullscreen}>{children}</PageFullscreenContext.Provider>
                </PageTitleSuffixContext.Provider>
              </PageTitleContext.Provider>
            </PageHeaderActionsContext.Provider>
          </SetPageFullscreenContext.Provider>
        </SetPageTitleSuffixContext.Provider>
      </SetPageTitleContext.Provider>
    </SetPageHeaderActionsContext.Provider>
  );
}

export function usePageHeaderActionsValue() {
  return useContext(PageHeaderActionsContext);
}

export function useSetPageHeaderActions() {
  const setActions = useContext(SetPageHeaderActionsContext);
  if (!setActions) {
    throw new Error("useSetPageHeaderActions must be used within a PageHeaderProvider");
  }
  return setActions;
}

export function usePageTitleValue() {
  return useContext(PageTitleContext);
}

export function useSetPageTitle() {
  const setTitle = useContext(SetPageTitleContext);
  if (!setTitle) {
    throw new Error("useSetPageTitle must be used within a PageHeaderProvider");
  }
  return setTitle;
}

export function usePageTitleSuffixValue() {
  return useContext(PageTitleSuffixContext);
}

export function useSetPageTitleSuffix() {
  const setSuffix = useContext(SetPageTitleSuffixContext);
  if (!setSuffix) {
    throw new Error("useSetPageTitleSuffix must be used within a PageHeaderProvider");
  }
  return setSuffix;
}

export function usePageFullscreenValue() {
  return useContext(PageFullscreenContext);
}

export function useSetPageFullscreen() {
  const setFullscreen = useContext(SetPageFullscreenContext);
  if (!setFullscreen) {
    throw new Error("useSetPageFullscreen must be used within a PageHeaderProvider");
  }
  return setFullscreen;
}
