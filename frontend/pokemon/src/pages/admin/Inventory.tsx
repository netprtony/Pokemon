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
import Input from "../../components/Input";
import Button from "../../components/Button";

// Kiểu dữ liệu cho 1 dòng Inventory
export type InventoryRow = {
  inventory_id: number;
  master_card_id: string;
  total_quantity: number;
  quantity_sold?: number;
  avg_purchase_price?: number;
  avg_selling_price?: number;
  storage_location?: string;
  language?: string;
  is_active: boolean;
  date_added: string;
  last_updated?: string;
  notes?: string;
  reference_image_url?: string; // Thêm trường này
};

const fieldOptions: FieldOption[] = [
  { value: "inventory_id", label: "ID", type: "number" },
  { value: "master_card_id", label: "Mã thẻ", type: "text" },
  { value: "total_quantity", label: "Tổng số lượng", type: "number" },
  { value: "quantity_sold", label: "Số lượng đã bán", type: "number" },
  { value: "avg_purchase_price", label: "Giá mua trung bình", type: "money" },
  { value: "avg_selling_price", label: "Giá bán trung bình", type: "money" },
  { value: "storage_location", label: "Vị trí lưu trữ", type: "text" },
  { value: "date_added", label: "Ngày thêm", type: "datetime" },
  { value: "last_updated", label: "Lần cập nhật cuối", type: "datetime" },
  { value: "is_active", label: "Đang hoạt động", type: "boolean" },
  { value: "language", label: "Ngôn ngữ", type: "text" },
  { value: "notes", label: "Ghi chú", type: "text" },
];

const API_URL = "http://localhost:8000/inventory";

type ModalMode = "add" | "edit" | null;

const defaultForm: InventoryRow = {
  inventory_id: 0,
  master_card_id: "",
  total_quantity: 0,
  quantity_sold: 0,
  avg_purchase_price: 0,
  avg_selling_price: 0,
  storage_location: "",
  language: "EN",
  is_active: true,
  date_added: "",
  last_updated: "",
  notes: "",
  reference_image_url: "",
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

  // File upload state
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewImgs, setPreviewImgs] = useState<string[]>([]);

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
        const resp = await axios.post(API_URL, form);
        toast.success("Thêm mới thành công!");
        // Chuyển sang chế độ edit inventory vừa tạo để upload ảnh
        setForm(resp.data as InventoryRow);
        setModalMode("edit");
        fetchData();
        return;
      } else if (modalMode === "edit") {
        await axios.put(`${API_URL}/${form.inventory_id}`, form);
        toast.success("Cập nhật thành công!");
        setModalOpen(false);
        fetchData();
      }
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



  const handlePreviewImage = (url: string) => setPreviewImg(url);
  // const handlePreviewImages = (urls: string[] = []) => setPreviewImgs(urls || []);

  // Table columns
  const columns = [
    {
      key: "reference_image_url", // Sửa lại key cho đúng với dữ liệu
      label: "",
      render: (row: InventoryRow) =>
        row.reference_image_url ? (
          <img
            src={row.reference_image_url}
            alt={row.master_card_id}
            style={{ width: 36, height: 36, objectFit: "contain", cursor: "pointer" }}
            onClick={() => row.reference_image_url && handlePreviewImage(row.reference_image_url)}
          />
        ) : (
          <i className="bi bi-image text-secondary fs-3" title="No image" />
        ),
      width: 50,
      align: "center" as const,
    },
    { key: "inventory_id", label: "ID" },
    { key: "master_card_id", label: "Mã thẻ" },
    { key: "total_quantity", label: "Số lượng" },
    { key: "quantity_sold", label: "Đã bán" },
    { key: "avg_purchase_price", label: "Giá mua TB" },
    { key: "avg_selling_price", label: "Giá bán TB" },
    { key: "storage_location", label: "Vị trí lưu trữ" },
    { key: "language", label: "Ngôn ngữ" },
    { key: "is_active", label: "Hoạt động" },
    { key: "date_added", label: "Ngày thêm" },
    { key: "last_updated", label: "Cập nhật cuối" },
    { key: "notes", label: "Ghi chú" },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: InventoryRow) => (
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-link p-0" title="Sửa" onClick={() => handleEdit(row)}>
            <i className="bi bi-pencil fs-5 text-warning"></i>
          </button>
          <button className="btn btn-link p-0" title="Xóa" onClick={() => handleDelete(row)}>
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
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "24px 32px",
        minWidth: 900,
        alignItems: "start",
        position: "relative",
      }}
    >
      {/* Cột 1: Chỉ hiển thị ảnh mẫu từ reference_image_url */}
      <div style={{ gridColumn: "1/2", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>Ảnh mẫu</label>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {form.reference_image_url ? (
            <img
              src={form.reference_image_url}
              alt="Reference"
              style={{
                width: 220,
                height: 220,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid #eee",
                marginBottom: 12,
                cursor: "pointer"
              }}
              onClick={() => form.reference_image_url && handlePreviewImage(form.reference_image_url)}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                background: "#f7f7fa",
                borderRadius: 12,
                border: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                color: "#bbb",
                fontSize: 48,
              }}
            >
              <i className="bi bi-image"></i>
            </div>
          )}
        </div>
      </div>

      {/* Cột 2: Các trường chính */}
      <div style={{ gridColumn: "2/3", display: "flex", flexDirection: "column", gap: 18 }}>
        <Input
          label="Mã thẻ"
          value={form.master_card_id}
          onChange={handleFormChange}
          name="master_card_id"
          type="text"
          required
        />
        <Input
          label="Tổng số lượng"
          value={form.total_quantity}
          onChange={handleFormChange}
          name="total_quantity"
          type="number"
          min={0}
          required
        />
        <Input
          label="Số lượng đã bán"
          value={form.quantity_sold}
          onChange={handleFormChange}
          name="quantity_sold"
          type="number"
          min={0}
        />
        <Input
          label="Mô tả"
          value={form.notes ?? ""}
          onChange={handleFormChange}
          name="notes"
          type="text"
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>Ngôn ngữ</label>
          <select
            className="mac-input"
            name="language"
            value={form.language ?? "US"}
            onChange={handleFormChange}
            style={{ marginTop: 2 }}
          >
            <option value="US">US</option>
            <option value="JP">JP</option>
          </select>
        </div>
      </div>

      {/* Cột 3: Giá, vị trí, ngày thêm */}
      <div style={{ gridColumn: "3/4", display: "flex", flexDirection: "column", gap: 18 }}>
        <Input
          label="Giá mua trung bình"
          value={form.avg_purchase_price}
          onChange={handleFormChange}
          name="avg_purchase_price"
          type="number"
          min={0}
          step={0.01}
        />
        <Input
          label="Giá bán trung bình"
          value={form.avg_selling_price}
          onChange={handleFormChange}
          name="avg_selling_price"
          type="number"
          min={0}
          step={0.01}
        />
        <Input
          label="Vị trí lưu trữ"
          value={form.storage_location ?? ""}
          onChange={handleFormChange}
          name="storage_location"
          type="text"
        />
        <Input
          label="Ngày thêm"
          value={form.date_added || new Date().toISOString().slice(0, 10)}
          onChange={handleFormChange}
          name="date_added"
          type="date"
          required
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>Đang hoạt động</label>
          <select
            className="mac-input"
            name="is_active"
            value={form.is_active ? "true" : "false"}
            onChange={e => handleFormChange({
              ...e,
              target: { ...e.target, value: e.target.value === "true", name: "is_active", type: "checkbox", checked: e.target.value === "true" }
            } as any)}
            style={{ marginTop: 2 }}
          >
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        </div>
      </div>

      {/* Button thao tác ở góc phải dưới cùng */}
      <div
        style={{
          gridColumn: "3/4",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 32,
          alignSelf: "end"
        }}
      >
        <Button type="submit" variant="primary" size="md">
          {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="gray-outline" size="md" onClick={handleCloseModal}>
          Đóng
        </Button>
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
      <Modal
        isOpen={!!previewImg}
        onClose={() => setPreviewImg(null)}
        title="Xem ảnh"
      >
        {previewImg && (
          <img src={previewImg} alt="Preview" style={{ width: "100%", maxHeight: 400, objectFit: "contain" }} />
        )}
      </Modal>
      <Modal
        isOpen={previewImgs.length > 0}
        onClose={() => setPreviewImgs([])}
        title="Xem tất cả ảnh"
      >
        <div className="d-flex flex-wrap gap-3">
          {previewImgs.map((url, idx) => (
            <img key={idx} src={url} alt={`Preview ${idx}`} style={{ width: 120, height: 120, objectFit: "contain", borderRadius: 8, border: "1px solid #eee" }} />
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;