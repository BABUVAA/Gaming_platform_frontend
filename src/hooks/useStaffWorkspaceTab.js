import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const useStaffWorkspaceTab = (validTabs, defaultTab) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = validTabs.includes(requestedTab)
    ? requestedTab
    : defaultTab;

  const selectTab = useCallback(
    (nextTab) => {
      if (!validTabs.includes(nextTab)) return;
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("tab", nextTab);
        return next;
      });
    },
    [setSearchParams, validTabs],
  );

  return [activeTab, selectTab];
};

export default useStaffWorkspaceTab;
