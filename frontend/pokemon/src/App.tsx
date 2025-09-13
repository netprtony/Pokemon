import React from "react";
import DataTable from "./components/Table";
import "bootstrap/dist/css/bootstrap.min.css";

type Column = {
  key: string;
  label: string;
};

type DataRow = {
  trackingId: string;
  product: string;
  customer: string;
  date: string;
  amount: string;
  paymentMode: string;
  status: string;
};

const columns: Column[] = [
  { key: "trackingId", label: "Tracking ID" },
  { key: "product", label: "Product" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "status", label: "Status" },
];

const data: DataRow[] = [
  {
    trackingId: "#20462",
    product: "Hat",
    customer: "Matt Dickerson",
    date: "13/05/2022",
    amount: "$4.95",
    paymentMode: "Tranfer Bank",
    status: "Delivered",
  },
  {
    trackingId: "#18933",
    product: "Laptop",
    customer: "Wiktoria",
    date: "22/05/2022",
    amount: "$8.95",
    paymentMode: "Cash on Delivery",
    status: "Delivered",
  },
  // ... add thêm data mẫu
];

const App: React.FC = () => {
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Customer Orders</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default App;
