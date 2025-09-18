import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng Inventory
export type InventoryRow = {
  inventory_id: number;
  master_card_id: string;
  card_name?: string;
  card_set?: string;
  card_rarity?: string;
  card_condition?: string;
  purchase_price?: number;
  purchase_date?: string;
  quantity?: number;
  location?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
};

const fieldOptions: FieldOption[] = [
  { value: "inventory_id", label: "ID", type: "number" },
  { value: "master_card_id", label: "Mã thẻ", type: "text" },
  { value: "card_name", label: "Tên thẻ", type: "text" },
  { value: "card_set", label: "Bộ thẻ", type: "text" },
  { value: "card_rarity", label: "Độ hiếm", type: "text" },
  { value: "card_condition", label: "Tình trạng", type: "text" },
  { value: "purchase_price", label: "Giá mua", type: "money" },
  { value: "purchase_date", label: "Ngày mua", type: "date" },
  { value: "quantity", label: "Số lượng", type: "number" },
  { value: "location", label: "Vị trí", type: "text" },
  { value: "note", label: "Ghi chú", type: "text" },
  { value: "created_at", label: "Ngày tạo", type: "datetime" },
  { value: "updated_at", label: "Ngày cập nhật", type: "datetime" },
];

const API_URL = "http://localhost:8000/inventory";

type ModalMode = "add" | "edit" | null;

const defaultForm: InventoryRow = {
  inventory_id: 0,
  master_card_id: "",
  card_name: "",
  card_set: "",
  card_rarity: "",
  card_condition: "",
  purchase_price: undefined,
  purchase_date: "",
  quantity: 1,
  location: "",
  note: "",
  created_at: "",
  updated_at: "",
};

const InventoryPage: React.FC = () => {
  const [data, setData] = useState<InventoryRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<InventoryRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [sortField, setSortField] = useState("inventory_id");
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
        const data = resp.data as { items: InventoryRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: InventoryRow[]; total: number }>(API_URL, {
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
  const handleEdit = (row: InventoryRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
  };

  // Xóa
  const handleDelete = (row: InventoryRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa thẻ "${row.master_card_id}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.inventory_id}`);
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
        await axios.put(`${API_URL}/${form.inventory_id}`, form);
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
    { key: "inventory_id", label: "ID", onSort: () => {}, sortActive: sortField === "inventory_id", sortDirection: sortOrder },
    { key: "master_card_id", label: "Mã thẻ", onSort: () => {}, sortActive: sortField === "master_card_id", sortDirection: sortOrder },
    { key: "card_name", label: "Tên thẻ", onSort: () => {}, sortActive: sortField === "card_name", sortDirection: sortOrder },
    { key: "card_set", label: "Bộ thẻ", onSort: () => {}, sortActive: sortField === "card_set", sortDirection: sortOrder },
    { key: "card_rarity", label: "Độ hiếm", onSort: () => {}, sortActive: sortField === "card_rarity", sortDirection: sortOrder },
    { key: "card_condition", label: "Tình trạng", onSort: () => {}, sortActive: sortField === "card_condition", sortDirection: sortOrder },
    { key: "purchase_price", label: "Giá mua", onSort: () => {}, sortActive: sortField === "purchase_price", sortDirection: sortOrder },
    { key: "purchase_date", label: "Ngày mua", onSort: () => {}, sortActive: sortField === "purchase_date", sortDirection: sortOrder },
    { key: "quantity", label: "Số lượng", onSort: () => {}, sortActive: sortField === "quantity", sortDirection: sortOrder },
    { key: "location", label: "Vị trí", onSort: () => {}, sortActive: sortField === "location", sortDirection: sortOrder },
    { key: "note", label: "Ghi chú", onSort: () => {}, sortActive: sortField === "note", sortDirection: sortOrder },
    { key: "created_at", label: "Ngày tạo", onSort: () => {}, sortActive: sortField === "created_at", sortDirection: sortOrder },
    { key: "updated_at", label: "Ngày cập nhật", onSort: () => {}, sortActive: sortField === "updated_at", sortDirection: sortOrder },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: InventoryRow, _idx: number) => (
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
        <label className="form-label fw-semibold">Mã thẻ</label>
        <input
          className="form-control"
          name="master_card_id"
          value={form.master_card_id}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tên thẻ</label>
        <input
          className="form-control"
          name="card_name"
          value={form.card_name || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Bộ thẻ</label>
        <input
          className="form-control"
          name="card_set"
          value={form.card_set || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Độ hiếm</label>
        <input
          className="form-control"
          name="card_rarity"
          value={form.card_rarity || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tình trạng</label>
        <input
          className="form-control"
          name="card_condition"
          value={form.card_condition || ""}
          onChange={handleFormChange}
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
        <label className="form-label fw-semibold">Ngày mua</label>
        <input
          className="form-control"
          type="date"
          name="purchase_date"
          value={form.purchase_date || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Số lượng</label>
        <input
          className="form-control"
          type="number"
          name="quantity"
          value={form.quantity ?? 1}
          onChange={handleFormChange}
          min={1}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Vị trí</label>
        <input
          className="form-control"
          name="location"
          value={form.location || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Ghi chú</label>
        <input
          className="form-control"
          name="note"
          value={form.note || ""}
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
      <h3 className="mb-3 fw-bold">Danh sách kho thẻ</h3>
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
          <i className="bi bi-plus-lg me-2"></i> Thêm thẻ mới
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
        title={modalMode === "add" ? "Thêm thẻ mới" : "Chỉnh sửa thẻ"}
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

export default InventoryPage;