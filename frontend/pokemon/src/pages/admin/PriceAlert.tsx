import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng PriceAlert
export type PriceAlertRow = {
  alert_id: number;
  inventory_id: number;
  alert_type: string;
  purchase_price?: number;
  current_market_price?: number;
  price_difference?: number;
  percentage_change?: number;
  alert_message?: string;
  alert_date: string;
  is_acknowledged: boolean;
};

const fieldOptions: FieldOption[] = [
  { value: "alert_id", label: "ID", type: "number" },
  { value: "inventory_id", label: "Mã kho", type: "number" },
  { value: "alert_type", label: "Loại cảnh báo", type: "text" },
  { value: "purchase_price", label: "Giá mua", type: "money" },
  { value: "current_market_price", label: "Giá thị trường", type: "money" },
  { value: "price_difference", label: "Chênh lệch giá", type: "money" },
  { value: "percentage_change", label: "Tỷ lệ thay đổi (%)", type: "number" },
  { value: "alert_message", label: "Nội dung cảnh báo", type: "text" },
  { value: "alert_date", label: "Ngày cảnh báo", type: "date" },
  { value: "is_acknowledged", label: "Đã xác nhận", type: "text" },
];

const API_URL = "http://localhost:8000/price-alerts";

type ModalMode = "add" | "edit" | null;

const defaultForm: PriceAlertRow = {
  alert_id: 0,
  inventory_id: 0,
  alert_type: "",
  purchase_price: undefined,
  current_market_price: undefined,
  price_difference: undefined,
  percentage_change: undefined,
  alert_message: "",
  alert_date: "",
  is_acknowledged: false,
};

const PriceAlertPage: React.FC = () => {
  const [data, setData] = useState<PriceAlertRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<PriceAlertRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [sortField, setSortField] = useState("alert_id");
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
        const data = resp.data as { items: PriceAlertRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: PriceAlertRow[]; total: number }>(API_URL, {
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
    } catch (err) {
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
  const handleEdit = (row: PriceAlertRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
  };

  // Xóa
  const handleDelete = (row: PriceAlertRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa cảnh báo "${row.alert_id}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.alert_id}`);
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
        await axios.put(`${API_URL}/${form.alert_id}`, form);
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
    { key: "alert_id", label: "ID", onSort: () => {}, sortActive: sortField === "alert_id", sortDirection: sortOrder },
    { key: "inventory_id", label: "Mã kho", onSort: () => {}, sortActive: sortField === "inventory_id", sortDirection: sortOrder },
    { key: "alert_type", label: "Loại cảnh báo", onSort: () => {}, sortActive: sortField === "alert_type", sortDirection: sortOrder },
    { key: "purchase_price", label: "Giá mua", onSort: () => {}, sortActive: sortField === "purchase_price", sortDirection: sortOrder },
    { key: "current_market_price", label: "Giá thị trường", onSort: () => {}, sortActive: sortField === "current_market_price", sortDirection: sortOrder },
    { key: "price_difference", label: "Chênh lệch giá", onSort: () => {}, sortActive: sortField === "price_difference", sortDirection: sortOrder },
    { key: "percentage_change", label: "Tỷ lệ thay đổi (%)", onSort: () => {}, sortActive: sortField === "percentage_change", sortDirection: sortOrder },
    { key: "alert_message", label: "Nội dung cảnh báo", onSort: () => {}, sortActive: sortField === "alert_message", sortDirection: sortOrder },
    { key: "alert_date", label: "Ngày cảnh báo", onSort: () => {}, sortActive: sortField === "alert_date", sortDirection: sortOrder },
    { key: "is_acknowledged", label: "Đã xác nhận", onSort: () => {}, sortActive: sortField === "is_acknowledged", sortDirection: sortOrder },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: PriceAlertRow, _idx: number) => (
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
        <label className="form-label fw-semibold">Mã kho</label>
        <input
          className="form-control"
          type="number"
          name="inventory_id"
          value={form.inventory_id}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Loại cảnh báo</label>
        <input
          className="form-control"
          name="alert_type"
          value={form.alert_type}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Giá mua</label>
        <input
          className="form-control"
          type="number"
          name="purchase_price"
          value={form.purchase_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Giá thị trường</label>
        <input
          className="form-control"
          type="number"
          name="current_market_price"
          value={form.current_market_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Chênh lệch giá</label>
        <input
          className="form-control"
          type="number"
          name="price_difference"
          value={form.price_difference ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tỷ lệ thay đổi (%)</label>
        <input
          className="form-control"
          type="number"
          name="percentage_change"
          value={form.percentage_change ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Nội dung cảnh báo</label>
        <input
          className="form-control"
          name="alert_message"
          value={form.alert_message || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Ngày cảnh báo</label>
        <input
          className="form-control"
          type="date"
          name="alert_date"
          value={form.alert_date}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Đã xác nhận</label>
        <input
          className="form-check-input ms-2"
          type="checkbox"
          name="is_acknowledged"
          checked={form.is_acknowledged}
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
      <h3 className="mb-3 fw-bold">Danh sách cảnh báo giá</h3>
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
          <i className="bi bi-plus-lg me-2"></i> Thêm cảnh báo mới
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
        title={modalMode === "add" ? "Thêm cảnh báo mới" : "Chỉnh sửa cảnh báo"}
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

export default PriceAlertPage;