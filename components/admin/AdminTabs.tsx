"use client";

import { useState } from "react";

interface AdminTabsProps {
  usersTab: React.ReactNode;
  configTab: React.ReactNode;
  advisorsTab: React.ReactNode;
  flowsTab: React.ReactNode;
}

export default function AdminTabs({ usersTab, configTab, advisorsTab, flowsTab }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<"users" | "config" | "advisors" | "flows">("users");

  const tabs = [
    { key: "users" as const, label: "Users" },
    { key: "config" as const, label: "Configuration" },
    { key: "advisors" as const, label: "Advisors" },
    { key: "flows" as const, label: "System Flows" },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && usersTab}
      {activeTab === "config" && configTab}
      {activeTab === "advisors" && advisorsTab}
      {activeTab === "flows" && flowsTab}
    </div>
  );
}
