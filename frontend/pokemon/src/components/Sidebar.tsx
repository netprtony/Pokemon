// Sidebar.tsx
import SidebarItem from "./SidebarItem";

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
    label: "Dashboard",
    dropdown: true,
    children: [
      { label: "Tổng quan", path: "/admin/dashboard", icon: "bi bi-bar-chart" },
    ],
  },
  {
    icon: "bi bi-building",
    label: "MASTER DATA",
    dropdown: true,
    children: [
      { label: "MASTER DATA", path: "/pokemon-sets", icon: "bi bi-collection" },
    ],
  },
  {
    icon: "bi bi-person",
    label: "Tài khoản",
    dropdown: true,
    children: [{ label: "Tài khoản", path: "/admin/accounts", icon: "bi bi-people" }],
  },
  {
    icon: "bi bi-people",
    label: "Khách Thuê",
    dropdown: true,
    children: [
      { label: "Khách Thuê", path: "/admin/tenants", icon: "bi bi-person-badge" },
      { label: "Quản lý đặt phòng online", path: "/admin/reservations", icon: "bi bi-calendar-check" },
    ],
  },
  {
    icon: "bi bi-file-earmark-text",
    label: "Hợp Đồng",
    dropdown: true,
    children: [{ label: "Hợp Đồng", path: "/admin/contracts", icon: "bi bi-file-earmark-medical" }],
  },
  {
    icon: "bi bi-lightning",
    label: "Dịch vụ",
    dropdown: true,
    children: [
      { label: "Công tơ điện", path: "/admin/electricity", icon: "bi bi-lightning-charge" },
      { label: "Công tơ nước", path: "/admin/water", icon: "bi bi-droplet" },
    ],
  },
  {
    icon: "bi bi-receipt",
    label: "Hóa Đơn",
    dropdown: true,
    children: [
      { label: "Hóa đơn", path: "/admin/invoices", icon: "bi bi-receipt-cutoff" },
      { label: "Thanh toán", path: "/admin/payments", icon: "bi bi-credit-card" },
    ],
  },
  {
    icon: "bi bi-pc-display",
    label: "Thiết bị",
    dropdown: true,
    children: [{ label: "Quản lý thiết bị", path: "/admin/devices", icon: "bi bi-pc" }],
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
      className="bg-white border-end p-3 d-flex flex-column"
      style={{ width: "240px", height: "100vh" }}
    >
      {sidebarItems.map((item, idx) => (
        <SidebarItem
          key={idx}
          icon={item.icon}
          label={item.label}
          path={item.path}
          dropdown={item.dropdown}
          children={item.children}
          subLabel={item.subLabel}
        />
      ))}
    </div>
  );
}
