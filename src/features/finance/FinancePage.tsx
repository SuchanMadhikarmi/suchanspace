import React from "react";
import {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { FinanceDashboard } from "./components/dashboard/FinanceDashboard";
import PortfolioOverview from "./components/portfolio/PortfolioOverview";
import { IncomeOverview } from "./components/income/IncomeOverview";
import { ExpenseOverview } from "./components/expenses/ExpenseOverview";
import { NetWorthDashboard } from "./components/networth/NetWorthDashboard";

type TabId = "dashboard" | "portfolio" | "income" | "expenses" | "networth";

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Wallet size={18} /> },
    { id: "portfolio", label: "Portfolio", icon: <PieChart size={18} /> },
    { id: "income", label: "Income", icon: <TrendingUp size={18} /> },
    { id: "expenses", label: "Expenses", icon: <TrendingDown size={18} /> },
    { id: "networth", label: "Net Worth", icon: <DollarSign size={18} /> },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <FinanceDashboard />;
      case "portfolio":
        return <PortfolioOverview />;
      case "income":
        return <IncomeOverview />;
      case "expenses":
        return <ExpenseOverview />;
      case "networth":
        return <NetWorthDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="section-content" style={{ maxWidth: 1200 }}>
      <div className="stagger-1 section-head" style={{ marginBottom: 32 }}>
        <div>
          <h1
            className="font-serif flex items-center gap-3"
            style={{
              fontSize: 38,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            <Wallet size={32} style={{ color: "var(--green)" }} />
            Personal Finance
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Manage your wealth, expenses, and portfolio.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex overflow-x-auto space-x-2 border-b mb-6 pb-2 stagger-1"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? "font-medium" : "hover:bg-black/5"
            }`}
            style={
              activeTab === tab.id
                ? {
                    color: "var(--green)",
                    borderBottom: "2px solid var(--green)",
                    backgroundColor: "var(--highlight)",
                    borderRadius: "8px 8px 0 0",
                  }
                : { color: "var(--muted)", borderRadius: "8px 8px 0 0" }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="stagger-2">{renderContent()}</div>
    </div>
  );
};

export default FinancePage;
