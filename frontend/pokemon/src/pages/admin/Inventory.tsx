import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter, FieldOption } from "../../components/AdvancedFilters";
import "../../assets/css/Inventory.css";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Toggle from "../../components/Toggle";

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
  reference_image_url?: string;
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

const API_URL = "http://localhost:8000/inventory/";

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
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<InventoryRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [sortField, setSortField] = useState("inventory_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewImgs, setPreviewImgs] = useState<string[]>([]);

  const fetchData = async (field = sortField, order = sortOrder) => {
    setLoading(true);
    try {
      let items: InventoryRow[] = [];
      let total = 0;
      if (filters.length > 0) {
        const resp = await axios.post(
          `${API_URL}filter`,
          { filters },
          { params: { page, page_size: pageSize, sort_field: field, sort_order: order } }
        );
        const data = resp.data as { items: any[]; total: number };
        items = data.items.map((row) => ({
          ...row,
          reference_image_url: row.card?.reference_image_url ?? "",
        }));
        total = data.total;
      } else {
        const resp = await axios.get<{ items: any[]; total: number }>(API_URL, {
          params: {
            page,
            page_size: pageSize,
            search: searchTerm,
            sort_field: field,
            sort_order: order,
          },
        });
        items = resp.data.items.map((row) => ({
          ...row,
          reference_image_url: row.card?.reference_image_url ?? "",
        }));
        total = resp.data.total;
      }
      setData(items);
      setTotal(total);
    } catch {
      toast.error("Lỗi khi tải dữ liệu!");
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters, searchTerm, sortField, sortOrder]);

  const handleAdd = () => {
    setForm(defaultForm);
    setModalMode("add");
    setModalOpen(true);
    setFormTouched(false);
  };

  const handleEdit = (row: InventoryRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
  };

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

  const handleSave = async () => {
    try {
      const { reference_image_url, ...payload } = form;
      if (modalMode === "add") {
        const resp = await axios.post(API_URL, payload);
        toast.success("Thêm mới thành công!");
        setForm(resp.data as InventoryRow);
        setModalMode("edit");
        fetchData();
      } else if (modalMode === "edit") {
        await axios.put(`${API_URL}/${form.inventory_id}`, payload);
        toast.success("Cập nhật thành công!");
        setModalOpen(false);
        fetchData();
      }
    } catch {
      toast.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // ✅ Hàm chung cập nhật form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, files, checked, dataset } = e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files?.[0] ?? null
          : dataset?.type === "money"
          ? value === "" ? 0 : Number(value)  // ✅ ép về number
          : type === "number"
          ? value === "" ? 0 : Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
    setFormTouched(true);
  };
  const handlePreviewImage = (url: string) => setPreviewImg(url);


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
          <img
            src="card_images/default-card-image.png" // Đường dẫn ảnh mặc định
            alt="No image"
            style={{ width: 36, height: 36, objectFit: "contain", opacity: 0.5 }}
          />
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
      {/* Cột 1: Chỉ hiển thị ảnh đại diện từ reference_image_url */}
      <div style={{ gridColumn: "1/2", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>Ảnh đại diện thẻ</label>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {form.reference_image_url ? (
            <img
              src={form.reference_image_url}
              alt="Reference"
              style={{
                width: 550,
                height: 550,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid #eee",
                marginBottom: 12,
                cursor: "zoom-in",
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
          <label className="mac-input-label" style={{ alignSelf: "flex-start" }}>Ngôn ngữ</label>
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
          name="avg_purchase_price"
          type="money"
          value={form.avg_purchase_price}
          onChange={handleFormChange}
        />
        <Input
          label="Giá bán trung bình"
          name="avg_selling_price"
          type="money"
          value={form.avg_selling_price}
          onChange={handleFormChange}
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
          value={
        form.date_added
          ? (() => {
          const d = new Date(form.date_added);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
            })()
          : (() => {
          const d = new Date();
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
            })()
          }
          onChange={handleFormChange}
          name="date_added"
          type="text"
          required
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label className="mac-input-label" style={{ alignSelf: "flex-start" }}>Đang hoạt động</label>
            <Toggle
              checked={form.is_active}
              onChange={(checked) => {
                setForm((prev) => ({ ...prev, is_active: checked }));
                setFormTouched(true);
              }}
         />
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