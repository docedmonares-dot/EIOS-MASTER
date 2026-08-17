import { useMemo, useState } from "react";

import "./EEUIRibbon.css";

export default function EEUIRibbon({
  tabs = [],
  defaultTab = "",
  activeTab: controlledActiveTab,
  onTabChange = null,
  renderCommands = null,
  actions = null,
  compact = false,
  className = "",
  ...ribbonProps
}) {
  const fallbackTab =
    defaultTab ||
    tabs[0]?.id ||
    tabs[0]?.label ||
    "";

  const [internalActiveTab, setInternalActiveTab] =
    useState(fallbackTab);

  const activeTab =
    controlledActiveTab ?? internalActiveTab;

  const activeTabDefinition = useMemo(
    () =>
      tabs.find(
        (tab) =>
          (tab.id || tab.label) === activeTab
      ) || null,
    [tabs, activeTab]
  );

  function handleTabChange(tab) {
    const nextTab = tab.id || tab.label;

    if (controlledActiveTab === undefined) {
      setInternalActiveTab(nextTab);
    }

    if (onTabChange) {
      onTabChange(nextTab, tab);
    }
  }

  const classes = [
    "eeui-ribbon",
    compact ? "eeui-ribbon--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      {...ribbonProps}
    >
      <div className="eeui-ribbon__topbar">
        <nav
          className="eeui-ribbon__tabs"
          aria-label="Ribbon tabs"
        >
          {tabs.map((tab) => {
            const tabKey =
              tab.id || tab.label;

            const isActive =
              tabKey === activeTab;

            return (
              <button
                key={tabKey}
                type="button"
                className={
                  isActive
                    ? "eeui-ribbon__tab eeui-ribbon__tab--active"
                    : "eeui-ribbon__tab"
                }
                onClick={() =>
                  handleTabChange(tab)
                }
              >
                {tab.icon && (
                  <tab.icon
                    size={16}
                    aria-hidden="true"
                  />
                )}

                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {actions && (
          <div className="eeui-ribbon__actions">
            {actions}
          </div>
        )}
      </div>

      <div className="eeui-ribbon__content">
        {renderCommands
          ? renderCommands(
              activeTab,
              activeTabDefinition
            )
          : activeTabDefinition?.content || null}
      </div>
    </section>
  );
}