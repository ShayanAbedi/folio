import { LaunchProps, List } from "@raycast/api";
import { useState } from "react";
import { usePortfolio } from "./lib/hooks";
import { usePrivacy } from "./lib/privacy";
import { flattenPositions, searchPositions } from "./lib/portfolio";
import { classifyError, ListEmpty } from "./components/empty";
import { PositionItem } from "./components/PositionItem";

export default function SearchPosition(props: LaunchProps<{ arguments: { ticker?: string } }>) {
  const [query, setQuery] = useState(props.arguments.ticker ?? "");
  const { snapshot, isLoading, error, refresh } = usePortfolio();
  const { privacy, ready, toggle } = usePrivacy();
  const [showDetail, setShowDetail] = useState(true);
  const all = snapshot ? flattenPositions(snapshot.accounts) : [];
  const matches = searchPositions(all, query);

  return (
    <List
      isLoading={isLoading || !ready}
      isShowingDetail={showDetail && matches.length > 0}
      searchText={query}
      onSearchTextChange={setQuery}
      filtering={false}
      searchBarPlaceholder="Ticker, e.g. AAPL or XEQT"
    >
      {error && all.length === 0 ? (
        <ListEmpty kind={classifyError(error)} error={error} onRetry={refresh} />
      ) : !isLoading && all.length === 0 ? (
        <ListEmpty kind="connect" onRetry={refresh} />
      ) : !isLoading && matches.length === 0 ? (
        <List.EmptyView
          title={`No position matches “${query}”`}
          description="Fathom only searches what you already hold. It doesn't look up quotes."
        />
      ) : (
        <List.Section
          title={query ? `Matches for ${query.toUpperCase()}` : "All positions"}
          subtitle={`${matches.length}`}
        >
          {matches.map((p) => (
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
