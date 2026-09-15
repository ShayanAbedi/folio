import { List } from "@raycast/api";
import { useState } from "react";
import { usePortfolio } from "./lib/hooks";
import { usePrivacy } from "./lib/privacy";
import { flattenPositions } from "./lib/portfolio";
import { classifyError, ListEmpty } from "./components/empty";
import { PositionItem } from "./components/PositionItem";

export default function ShowPositions() {
  const { snapshot, isLoading, error, refresh } = usePortfolio();
  const { privacy, ready, toggle } = usePrivacy();
  const [showDetail, setShowDetail] = useState(false);
  const positions = snapshot ? flattenPositions(snapshot.accounts) : [];

  return (
    <List
      isLoading={isLoading || !ready}
      isShowingDetail={showDetail && positions.length > 0}
      searchBarPlaceholder="Search ticker, name or account…"
    >
      {error && positions.length === 0 ? (
        <ListEmpty kind={classifyError(error)} error={error} onRetry={refresh} />
      ) : !isLoading && positions.length === 0 ? (
        <ListEmpty kind={snapshot && snapshot.accounts.length === 0 ? "connect" : "no-data"} onRetry={refresh} />
      ) : (
        <List.Section title="Positions" subtitle={`${positions.length}`}>
          {positions.map((p) => (
            <PositionItem
              key={p.key}
              position={p}
              privacy={privacy}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail((v) => !v)}
              onTogglePrivacy={toggle}
              onRefresh={refresh}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
