"use client";

import { useState } from "react";

interface AdminTabsProps {
  role: string;
  showUsers: boolean;
  showConfig: boolean;
  showAdvisors: boolean;
  showFlows: boolean;
  usersTab: React.ReactNode;
  configTab: React.ReactNode;
  advisorsTab: React.ReactNode;
  flowsTab: React.ReactNode;
}

type TabKey = "users" | "config" | "advisors" | "flows";

export default function AdminTabs({
  showUsers,
  showConfig,
  showAdvisors,
  showFlows,
  usersTab,
  configTab,
  advisorsTab,
  flowsTab,
}: AdminTabsProps) {
  const allTabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: "users", label: "Users", visible: showUsers },
    { key: "config", label: "Configuration", visible: showConfig },
    { key: "advisors", label: "Advisors", visible: showAdvisors },
    { key: "flows", label: "System Flows", visible: showFlows },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);
  const defaultTab = visibleTabs[0]?.key ?? "flows";

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  const safeTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : defaultTab;

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
              safeTab === tab.key
                ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {safeTab === "users" && usersTab}
      {safeTab === "config" && configTab}
      {safeTab === "advisors" && advisorsTab}
      {safeTab === "flows" && flowsTab}
    </div>
  );
}
