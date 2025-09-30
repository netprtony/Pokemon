// Sidebar.tsx
import SidebarItem from "./SidebarItem";
import "../assets/css/theme.css";
type SidebarChild = {
  label: string;
  path: string;
  icon?: string; // icon cho từng child nếu muốn
};

type SidebarItemData = {
  icon: string; // tên icon bootstrap, ví dụ "bi bi-house"
  label: string;
  path?: string;
  dropdown?: boolean;
  children?: SidebarChild[];
  subLabel?: string;
};

const sidebarItems: SidebarItemData[] = [
  {
    icon: "bi bi-speedometer2",
    label: "REPORTING & ANALYTICS VIEWS",
    dropdown: true,
    children: [
      { label: "Inventory Summary", path: "/admin/inventory-summary", icon: "bi bi-bar-chart" },
      { label: "Sales Reports", path: "/admin/sales-reports", icon: "bi bi-graph-up" },
      { label: "Customer Insights", path: "/admin/customer-insights", icon: "bi bi-people" },
      { label: "Performance Metrics", path: "/admin/performance-metrics", icon: "bi bi-speedometer2" },
      { label: "Market Comparison", path: "/admin/market-comparison", icon: "bi bi-graph-up" },
      { label: "Sales Trends", path: "/admin/sales-trends", icon: "bi bi-trending-up" },
      { label: "Top Selling Cards", path: "/admin/top-selling-cards", icon: "bi bi-award" },
      { label: "Price History", path: "/admin/price-history", icon: "bi bi-clock-history" },
    ],
  },
  {
    icon: "bi bi-building",
    label: "MASTER DATA",
    dropdown: true,
    children: [
      { label: "Set", path: "/admin/pokemon-set", icon: "bi bi-collection" },
      { label: "Card", path: "/admin/pokemon-card", icon: "bi bi-people" }
    ],
  },
  {
    icon: "bi bi-person",
    label: "INVENTORY MANAGEMENT",
    dropdown: true,
    children: [{ label: "Inventory", path: "/admin/inventory", icon: "bi bi-box" }],
  },
  {
    icon: "bi bi-people",
    label: "MARKET ANALYSIS & PRICING",
    dropdown: true,
    children: [
      { label: "Market Prices", path: "/admin/market-price", icon: "bi bi-person-badge" },
      { label: "Price Alerts", path: "/admin/price-alert", icon: "bi bi-clock-history" },
    ],
  },
  {
    icon: "bi bi-file-earmark-text",
    label: "ORDER MANAGEMENT",
    dropdown: true,
    children: [
      { label: "Orders", path: "/admin/order", icon: "bi bi-file-earmark-medical" },
      { label: "Order Details", path: "/admin/order-details", icon: "bi bi-truck" },

    ],
  },
  {
    icon: "bi bi-gear",
    label: "Cài Đặt",
    dropdown: true,
    children: [
      { label: "Cài đặt chung", path: "/admin/settings", icon: "bi bi-sliders" },
      { label: "Sao lưu dữ liệu", path: "/admin/backup", icon: "bi bi-cloud-arrow-up" },
      { label: "Khôi phục dữ liệu", path: "/admin/restore", icon: "bi bi-cloud-arrow-down" },
    ],
  },
];

export default function Sidebar() {
  return (
    <div
      className="sidebar-macos d-flex flex-column p-4"
      style={{ width: "260px", height: "100vh" }}
    >
      {sidebarItems.map((item, idx) => (
        <SidebarItem
          key={idx}
          icon={item.icon}
          label={item.label}
          path={item.path}
          dropdown={item.dropdown}
          children={item.children}
        />
      ))}
    </div>
  );
}
