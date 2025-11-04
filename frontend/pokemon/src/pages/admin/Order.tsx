import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng Order
export type OrderRow = {
  order_id: number;
  order_date: string;
  customer_name?: string;
  customer_contact?: string;
  order_status: string;
  total_amount: number;
  shipping_address?: string;
  payment_method?: string;
  platform?: string;
  created_at?: string;
  updated_at?: string;
};

const fieldOptions: FieldOption[] = [
  { value: "order_id", label: "Order ID", type: "number" },
  { value: "order_date", label: "Ngày đặt", type: "date" },
  { value: "customer_name", label: "Tên khách hàng", type: "text" },
  { value: "customer_contact", label: "Liên hệ", type: "text" },
  { value: "order_status", label: "Trạng thái", type: "text" },
  { value: "total_amount", label: "Tổng tiền", type: "money" },
  { value: "shipping_address", label: "Địa chỉ giao hàng", type: "text" },
  { value: "payment_method", label: "Thanh toán", type: "text" },
  { value: "platform", label: "Nền tảng", type: "text" },
  { value: "created_at", label: "Ngày tạo", type: "datetime" },
  { value: "updated_at", label: "Ngày cập nhật", type: "datetime" },
];

const API_URL = "http://localhost:8000/orders";

type ModalMode = "add" | "edit" | null;

const defaultForm: OrderRow = {
  order_id: 0,
  order_date: "",
  customer_name: "",
  customer_contact: "",
  order_status: "",
  total_amount: 0,
  shipping_address: "",
  payment_method: "",
  platform: "",
  created_at: "",
  updated_at: "",
};

const OrderPage: React.FC = () => {
  const [data, setData] = useState<OrderRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<OrderRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [sortField, setSortField] = useState("order_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch data
  const fetchData = async (field = sortField, order = sortOrder) => {
    setLoading(true);
    try {
      if (filters.length > 0) {
        const resp = await axios.post(
          `${API_URL}/filter`,
          { filters },
          { params: { page, page_size: pageSize, sort_field: field, sort_order: order } }
        );
        const data = resp.data as { items: OrderRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: OrderRow[]; total: number }>(API_URL, {
          params: {
            page,
            page_size: pageSize,
            search: searchTerm,
            sort_field: field,
            sort_order: order,
          },
        });
        setData(resp.data.items);
        setTotal(resp.data.total);
      }
    } catch {
      toast.error("Lỗi khi tải dữ liệu!");
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters, searchTerm, sortField, sortOrder]);

  // Thêm mới
  const handleAdd = () => {
    setForm(defaultForm);
    setModalMode("add");
    setModalOpen(true);
    setFormTouched(false);
  };

  // Sửa
  const handleEdit = (row: OrderRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
  };

  // Xóa
  const handleDelete = (row: OrderRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa đơn hàng "${row.order_id}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.order_id}`);
        toast.success("Xóa thành công!");
        fetchData();
      } catch {
        toast.error("Lỗi khi xóa!");
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  // Đóng modal nhập thông tin (add/edit)
  const handleCloseModal = () => {
    if (formTouched) {
      setConfirmMessage("Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?");
      setConfirmAction(() => () => {
        setModalOpen(false);
        setConfirmOpen(false);
      });
      setConfirmOpen(true);
    } else {
      setModalOpen(false);
    }
  };

  // Lưu (add/edit)
  const handleSave = async () => {
    try {
      if (modalMode === "add") {
        await axios.post(API_URL, form);
        toast.success("Thêm mới thành công!");
      } else if (modalMode === "edit") {
        await axios.put(`${API_URL}/${form.order_id}`, form);
        toast.success("Cập nhật thành công!");
      }
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // Xử lý thay đổi form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number"
        ? Number(value)
        : type === "checkbox"
        ? target.checked
        : value,
    }));
    setFormTouched(true);
  };

  // Table columns
  const columns = [
    { key: "order_id", label: "Order ID", onSort: () => {}, sortActive: sortField === "order_id", sortDirection: sortOrder },
    { key: "order_date", label: "Ngày đặt", onSort: () => {}, sortActive: sortField === "order_date", sortDirection: sortOrder },
    { key: "customer_name", label: "Tên khách hàng", onSort: () => {}, sortActive: sortField === "customer_name", sortDirection: sortOrder },
    { key: "customer_contact", label: "Liên hệ", onSort: () => {}, sortActive: sortField === "customer_contact", sortDirection: sortOrder },
    { key: "order_status", label: "Trạng thái", onSort: () => {}, sortActive: sortField === "order_status", sortDirection: sortOrder },
    { key: "total_amount", label: "Tổng tiền", onSort: () => {}, sortActive: sortField === "total_amount", sortDirection: sortOrder },
    { key: "shipping_address", label: "Địa chỉ giao hàng", onSort: () => {}, sortActive: sortField === "shipping_address", sortDirection: sortOrder },
    { key: "payment_method", label: "Thanh toán", onSort: () => {}, sortActive: sortField === "payment_method", sortDirection: sortOrder },
    { key: "platform", label: "Nền tảng", onSort: () => {}, sortActive: sortField === "platform", sortDirection: sortOrder },
    { key: "created_at", label: "Ngày tạo", onSort: () => {}, sortActive: sortField === "created_at", sortDirection: sortOrder },
    { key: "updated_at", label: "Ngày cập nhật", onSort: () => {}, sortActive: sortField === "updated_at", sortDirection: sortOrder },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: OrderRow) => (
        <div className="d-flex justify-content-center gap-3">
          <button
            className="btn btn-link p-0"
            title="Sửa"
            onClick={() => handleEdit(row)}
          >
            <i className="bi bi-pencil fs-5 text-warning"></i>
          </button>
          <button
            className="btn btn-link p-0"
            title="Xóa"
            onClick={() => handleDelete(row)}
          >
            <i className="bi bi-trash fs-5 text-danger"></i>
          </button>
        </div>
      ),
    },
  ];

  // AdvancedFilters handlers
  const handleAddFilter = (filter: Filter) => {
    setFilters((prev) => [...prev, filter]);
    setPage(1);
  };

  const handleRemoveFilter = (idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleExportCSV = () => toast.info("Export CSV (dummy)");
  const handleExportJSON = () => toast.info("Export JSON (dummy)");

  // Form modal content
  const renderFormModal = () => (
    <form className="px-3 pb-3" autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div className="mb-3">
        <label className="form-label fw-semibold">Order Date</label>
        <input
          className="form-control"
          type="date"
          name="order_date"
          value={form.order_date}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tên khách hàng</label>
        <input
          className="form-control"
          name="customer_name"
          value={form.customer_name || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Liên hệ</label>
        <input
          className="form-control"
          name="customer_contact"
          value={form.customer_contact || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Trạng thái</label>
        <input
          className="form-control"
          name="order_status"
          value={form.order_status}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tổng tiền</label>
        <input
          className="form-control"
          type="number"
          name="total_amount"
          value={form.total_amount}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Địa chỉ giao hàng</label>
        <input
          className="form-control"
          name="shipping_address"
          value={form.shipping_address || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Thanh toán</label>
        <input
          className="form-control"
          name="payment_method"
          value={form.payment_method || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Nền tảng</label>
        <input
          className="form-control"
          name="platform"
          value={form.platform || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-primary flex-grow-1">
          {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
        </button>
        <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={handleCloseModal}>
          Đóng
        </button>
      </div>
    </form>
  );

  function handleSort(field: string, order: "asc" | "desc"): void {
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  }

  return (
    <div className="container-fluid py-4">
      <h3 className="mb-3 fw-bold">Danh sách đơn hàng</h3>
      <AdvancedFilters
        fieldOptions={fieldOptions}
        filters={filters}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onSearch={handleSearch}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
      />
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-2"></i> Thêm đơn hàng mới
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        pageSizeOptions={[5, 10, 20, 50]}
        totalRows={total}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        loading={loading}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
      />
      {/* Modal nhập thông tin */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={modalMode === "add" ? "Thêm đơn hàng mới" : "Chỉnh sửa đơn hàng"}
        message=""
        confirmText=""
        cancelText=""
        onConfirm={undefined}
      >
        {renderFormModal()}
      </Modal>
      {/* Modal xác nhận */}
      <ModalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction || (() => setConfirmOpen(false))}
        title="Xác nhận"
        message={confirmMessage}
        confirmText="Đồng ý"
        cancelText="Hủy"
      />
    </div>
  );
};

export default OrderPage;