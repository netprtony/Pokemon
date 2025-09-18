import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";
import "../../assets/css/Inventory.css";

// Kiểu dữ liệu cho 1 dòng Inventory
export type InventoryRow = {
  inventory_id: number;
  master_card_id: string;
  quantity_in_stock: number;
  quantity_sold: number;
  purchase_price: number;
  selling_price?: number;
  storage_location?: string;
  physical_condition_us: string;
  physical_condition_jp: string;
  card_photos?: any;
  photo_count?: number;
  date_added: string;
  last_updated?: string;
  is_active?: boolean;
  notes?: string;
  language?: string;
  is_graded?: boolean;
  grade_company?: string;
  grade_score?: number;
};

const fieldOptions: FieldOption[] = [
  { value: "inventory_id", label: "ID", type: "number" },
  { value: "master_card_id", label: "Mã thẻ", type: "text" },
  { value: "quantity_in_stock", label: "Số lượng trong kho", type: "number" },
  { value: "quantity_sold", label: "Số lượng đã bán", type: "number" },
  { value: "purchase_rarity", label: "Độ hiếm", type: "text" },
  { value: "selling_price", label: "Giá bán", type: "money" },
  { value: "storage_location", label: "Vị trí lưu trữ", type: "text" },
  { value: "physical_condition_us", label: "Tình trạng (US)", type: "text" },
  { value: "physical_condition_jp", label: "Tình trạng (JP)", type: "text" },
  { value: "photo_count", label: "Số lượng ảnh thẻ", type: "number" },
  { value: "physical_condition", label: "Vị trí đời thực", type: "text" },
  { value: "note", label: "Ghi chú", type: "text" },
  { value: "physical_condition", label: "Tình trạng vật lý", type: "text" },
  { value: "date_added", label: "Ngày thêm", type: "datetime" },
  { value: "last_updated", label: "Lần cập nhật cuối", type: "datetime" },
  { value: "is_active", label: "Đang hoạt động", type: "boolean" },
  { value: "language", label: "Ngôn ngữ", type: "text" },
  { value: "is_graded", label: "Đã chấm điểm", type: "boolean" },
  { value: "grade_company", label: "Công ty chấm điểm", type: "text" },
  { value: "grade_score", label: "Điểm chấm", type: "number" },
  { value: "notes", label: "Ghi chú", type: "text" },
];

const API_URL = "http://localhost:8000/inventory";

type ModalMode = "add" | "edit" | null;

const defaultForm: InventoryRow = {
  inventory_id: 0,
  master_card_id: "",
  quantity_in_stock: 0,
  quantity_sold: 0,
  purchase_price: 0,
  selling_price: undefined,
  storage_location: "",
  physical_condition_us: "",
  physical_condition_jp: "",
  card_photos: undefined,
  photo_count: 0,
  date_added: "",
  last_updated: "",
  is_active: true,
  notes: "",
  language: "",
  is_graded: false,
  grade_company: "",
  grade_score: 0,
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
    { key: "inventory_id", label: "ID", onSort: () => handleSort("inventory_id", sortOrder), sortActive: sortField === "inventory_id", sortDirection: sortOrder },
    { key: "master_card_id", label: "Mã thẻ", onSort: () => handleSort("master_card_id", sortOrder), sortActive: sortField === "master_card_id", sortDirection: sortOrder },
    { key: "quantity_in_stock", label: "Số lượng trong kho", onSort: () => handleSort("quantity_in_stock", sortOrder), sortActive: sortField === "quantity_in_stock", sortDirection: sortOrder },
    { key: "quantity_sold", label: "Số lượng đã bán", onSort: () => handleSort("quantity_sold", sortOrder), sortActive: sortField === "quantity_sold", sortDirection: sortOrder },
    { key: "purchase_price", label: "Giá mua", onSort: () => handleSort("purchase_price", sortOrder), sortActive: sortField === "purchase_price", sortDirection: sortOrder },
    { key: "selling_price", label: "Giá bán", onSort: () => handleSort("selling_price", sortOrder), sortActive: sortField === "selling_price", sortDirection: sortOrder },
    { key: "storage_location", label: "Vị trí lưu trữ", onSort: () => handleSort("storage_location", sortOrder), sortActive: sortField === "storage_location", sortDirection: sortOrder },
    { key: "physical_condition_us", label: "Tình trạng (US)", onSort: () => handleSort("physical_condition_us", sortOrder), sortActive: sortField === "physical_condition_us", sortDirection: sortOrder },
    { key: "physical_condition_jp", label: "Tình trạng (JP)", onSort: () => handleSort("physical_condition_jp", sortOrder), sortActive: sortField === "physical_condition_jp", sortDirection: sortOrder },
    { key: "card_photos", label: "Ảnh thẻ", onSort: () => handleSort("card_photos", sortOrder), sortActive: sortField === "card_photos", sortDirection: sortOrder },
    { key: "photo_count", label: "Số lượng ảnh thẻ", onSort: () => handleSort("photo_count", sortOrder), sortActive: sortField === "photo_count", sortDirection: sortOrder },
    { key: "date_added", label: "Ngày thêm", onSort: () => handleSort("date_added", sortOrder), sortActive: sortField === "date_added", sortDirection: sortOrder },
    { key: "last_updated", label: "Lần cập nhật cuối", onSort: () => handleSort("last_updated", sortOrder), sortActive: sortField === "last_updated", sortDirection: sortOrder },
    { key: "is_active", label: "Đang hoạt động", onSort: () => handleSort("is_active", sortOrder), sortActive: sortField === "is_active", sortDirection: sortOrder },
    { key: "notes", label: "Ghi chú", onSort: () => handleSort("notes", sortOrder), sortActive: sortField === "notes", sortDirection: sortOrder },
    { key: "language", label: "Ngôn ngữ", onSort: () => handleSort("language", sortOrder), sortActive: sortField === "language", sortDirection: sortOrder },
    { key: "is_graded", label: "Đã chấm điểm", onSort: () => handleSort("is_graded", sortOrder), sortActive: sortField === "is_graded", sortDirection: sortOrder },
    { key: "grade_company", label: "Công ty chấm điểm", onSort: () => handleSort("grade_company", sortOrder), sortActive: sortField === "grade_company", sortDirection: sortOrder },
    { key: "grade_score", label: "Điểm chấm", onSort: () => handleSort("grade_score", sortOrder), sortActive: sortField === "grade_score", sortDirection: sortOrder },
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
    <form
      className="inventory-modal-form"
      autoComplete="off"
      onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px 32px",
        paddingBottom: 0,
        minWidth: 600,
      }}
    >
      {/* Cột trái */}
      <div>
        <label className="form-label fw-semibold">Mã thẻ</label>
        <input className="form-control" name="master_card_id" value={form.master_card_id} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Số lượng trong kho</label>
        <input className="form-control" type="number" name="quantity_in_stock" value={form.quantity_in_stock} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Số lượng đã bán</label>
        <input className="form-control" type="number" name="quantity_sold" value={form.quantity_sold} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Giá mua</label>
        <input className="form-control" type="number" name="purchase_price" value={form.purchase_price} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Giá bán</label>
        <input className="form-control" type="number" name="selling_price" value={form.selling_price ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Vị trí lưu trữ</label>
        <input className="form-control" name="storage_location" value={form.storage_location ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Tình trạng (US)</label>
        <input className="form-control" name="physical_condition_us" value={form.physical_condition_us} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Tình trạng (JP)</label>
        <input className="form-control" name="physical_condition_jp" value={form.physical_condition_jp} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Số lượng ảnh thẻ</label>
        <input className="form-control" type="number" name="photo_count" value={form.photo_count ?? 0} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Ngày thêm</label>
        <input className="form-control" type="date" name="date_added" value={form.date_added} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Đang hoạt động</label>
        <select className="form-select" name="is_active" value={form.is_active ? "true" : "false"}
          onChange={e => handleFormChange({
            ...e,
            target: { ...e.target, value: e.target.value === "true", name: "is_active", type: "checkbox", checked: e.target.value === "true" }
          } as any)}
        >
          <option value="true">Có</option>
          <option value="false">Không</option>
        </select>
      </div>
      <div>
        <label className="form-label fw-semibold">Ghi chú</label>
        <input className="form-control" name="notes" value={form.notes ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Ngôn ngữ</label>
        <input className="form-control" name="language" value={form.language ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Đã chấm điểm</label>
        <select className="form-select" name="is_graded" value={form.is_graded ? "true" : "false"}
          onChange={e => handleFormChange({
            ...e,
            target: { ...e.target, value: e.target.value === "true", name: "is_graded", type: "checkbox", checked: e.target.value === "true" }
          } as any)}
        >
          <option value="false">Chưa</option>
          <option value="true">Đã chấm</option>
        </select>
      </div>
      <div>
        <label className="form-label fw-semibold">Công ty chấm điểm</label>
        <input className="form-control" name="grade_company" value={form.grade_company ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Điểm chấm</label>
        <input className="form-control" type="number" name="grade_score" value={form.grade_score ?? ""} onChange={handleFormChange} />
      </div>
      {/* Button thao tác ở góc phải dưới */}
      <div style={{
        gridColumn: "1 / span 2",
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
      }}>
        <button type="submit" className="btn btn-primary">
          {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
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