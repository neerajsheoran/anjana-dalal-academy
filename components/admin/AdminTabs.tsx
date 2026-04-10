"use client";

import { useState } from "react";

interface AdminTabsProps {
  role: string;
  showUsers: boolean;
  showConfig: boolean;
  showAdvisors: boolean;
  showFlows: boolean;
  showSupport: boolean;
  usersTab: React.ReactNode;
  configTab: React.ReactNode;
  advisorsTab: React.ReactNode;
  flowsTab: React.ReactNode;
  decisionsTab: React.ReactNode;
  supportTab: React.ReactNode;
  testCasesTab?: React.ReactNode;
}

type TabKey = "users" | "config" | "advisors" | "support" | "docs";
type DocsSubTab = "flows" | "decisions" | "testcases";

export default function AdminTabs({
  showUsers,
  showConfig,
  showAdvisors,
  showFlows,
  showSupport,
  usersTab,
  configTab,
  advisorsTab,
  flowsTab,
  decisionsTab,
  supportTab,
  testCasesTab,
}: AdminTabsProps) {
  const allTabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: "users", label: "Users", visible: showUsers },
    { key: "config", label: "Configuration", visible: showConfig },
    { key: "advisors", label: "Advisors", visible: showAdvisors },
    { key: "support", label: "Support", visible: showSupport },
    { key: "docs", label: "Docs", visible: showFlows },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);
  const defaultTab = visibleTabs[0]?.key ?? "docs";

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [docsSubTab, setDocsSubTab] = useState<DocsSubTab>("flows");

  const safeTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : defaultTab;

  const docsSubTabs: { key: DocsSubTab; label: string }[] = [
    { key: "flows", label: "System Flows" },
    { key: "decisions", label: "Technical Decisions" },
    { key: "testcases", label: "Test Cases" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
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
      {safeTab === "support" && supportTab}
      {safeTab === "docs" && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-1 mb-5">
            {docsSubTabs.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setDocsSubTab(sub.key)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  docsSubTab === sub.key
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {docsSubTab === "flows" && flowsTab}
          {docsSubTab === "decisions" && decisionsTab}
          {docsSubTab === "testcases" && testCasesTab}
        </div>
      )}
    </div>
  );
}
