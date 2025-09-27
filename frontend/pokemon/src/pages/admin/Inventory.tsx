import React, { useEffect, useState, useCallback } from "react";
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
import AsyncSelect from "react-select/async";

// --- Constants & Mapping ---
const API_URL = "http://localhost:8000/inventory/";
const US_OPTIONS = [
  { value: "NearMint", label: "Near Mint" },
  { value: "LightlyPlayed", label: "Lightly Played" },
  { value: "ModeratelyPlayed", label: "Moderately Played" },
  { value: "HeavilyPlayed", label: "Heavily Played" },
  { value: "Damaged", label: "Damaged" },
];

const JP_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

// Ánh xạ US <-> JP
const US_TO_JP: Record<string, string> = {
  NearMint: "A",
  LightlyPlayed: "B",
  ModeratelyPlayed: "C",
  HeavilyPlayed: "D",
  Damaged: "D",
};
const JP_TO_US: Record<string, string> = {
  A: "NearMint",
  B: "LightlyPlayed",
  C: "ModeratelyPlayed",
  D: "HeavilyPlayed", // hoặc "Damaged" nếu muốn
};

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
export type DetailInventoryForm = {
  detail_id: number;
  inventory_id: number;
  physical_condition_us: string;
  physical_condition_jp: string;
  is_graded: boolean;
  grade_company: string;
  grade_score: string;
  purchase_price: string;
  selling_price: string;
  card_photos: string[];
  date_added: string;
  last_updated: string;
  is_sold: boolean;
  notes: string;
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
  // Sửa lại: luôn khởi tạo ngày hiện tại theo định dạng YYYY-MM-DD
  date_added: new Date().toISOString().slice(0, 10),
  last_updated: "",
  notes: "",
};

const defaultDetailForm = {
  detail_id: 0,
  inventory_id: 0,
  physical_condition_us: "",
  physical_condition_jp: "",
  is_graded: false,
  grade_company: "",
  grade_score: "",
  purchase_price: "",
  selling_price: "",
  card_photos: [],
  date_added: new Date().toISOString().slice(0, 10),
  last_updated: "",
  photo_count: 0,
  is_sold: false,
  notes: "",
};

// --- Helper functions ---
const formatDate = (date: string) => {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const parts = date.split(/[-\/]/);
  if (parts.length === 3 && parts[2].length === 4)
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  return date;
};

// --- Custom hooks ---
function useInventoryData({
  filters,
  searchTerm,
  page,
  pageSize,
  sortField,
  sortOrder,
}: {
  filters: Filter[];
  searchTerm: string;
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: "asc" | "desc";
}) {
  const [data, setData] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let items: InventoryRow[] = [];
      let total = 0;
      if (filters.length > 0) {
        const resp = await axios.post(
          `${API_URL}filter`,
          { filters },
          { params: { page, page_size: pageSize, sort_field: sortField, sort_order: sortOrder } }
        );
        const data = resp.data as { items: any[]; total: number };
        items = data.items.map((row) => ({
          ...row,
          reference_image_url: row.card?.reference_image_url ?? "",
        }));
        total = data.total;
      } else {
        const resp = await axios.get<{ items: any[]; total: number }>(API_URL, {
          params: { page, page_size: pageSize, search: searchTerm, sort_field: sortField, sort_order: sortOrder },
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
  }, [filters, searchTerm, page, pageSize, sortField, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, total, loading, fetchData };
}

// --- Table columns ---
const getColumns = (
  handlePreviewImage: (url: string) => void,
  handleAddDetail: (row: InventoryRow) => void,
  handleEdit: (row: InventoryRow) => void,
  handleDelete: (row: InventoryRow) => void
) => [
  {
    key: "reference_image_url",
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
        <img alt="No image" style={{ width: 36, height: 36, objectFit: "contain", opacity: 0.5 }} />
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
  {
    key: "is_active",
    label: "Hoạt động",
    render: (row: InventoryRow) =>
      row.is_active ? (
        <span className="badge bg-success">Còn hàng</span>
      ) : (
        <span className="badge bg-danger">Hết hàng</span>
      ),
    align: "center" as const,
    width: 90,
  },
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
        <button className="btn btn-link p-0" title="Thêm chi tiết kho" onClick={() => handleAddDetail(row)}>
          <i className="bi bi-plus fs-5 text-success"></i>
        </button>
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

// --- Main Component ---
const InventoryPage: React.FC = () => {
  // --- State ---
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState("inventory_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- Data ---
  const { data, total, loading, fetchData } = useInventoryData({
    filters, searchTerm, page, pageSize, sortField, sortOrder
  });

  // --- Modal, Form, Detail State ---
  type ModalMode = "add" | "edit" | null;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<InventoryRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewImgs, setPreviewImgs] = useState<string[]>([]);
  const [detailData, setDetailData] = useState<Record<number, any[]>>({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailForm, setDetailForm] = useState(defaultDetailForm);
  const [detailModalMode, setDetailModalMode] = useState<"add" | "edit" | null>(null);
  const [detailFormTouched, setDetailFormTouched] = useState(false);

  const [detailImages, setDetailImages] = React.useState<{file: File, name: string}[]>([]);
  const [detailAngles, setDetailAngles] = React.useState<string[]>([]);

  // --- Handlers ---
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
        await axios.delete(`${API_URL}${row.inventory_id}`);
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
    if (formTouched || detailFormTouched) {
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
      const { reference_image_url, inventory_id, ...payload } = form;
      // Nếu date_added rỗng, set lại ngày hiện tại
      if (!payload.date_added) {
        payload.date_added = new Date().toISOString().slice(0, 10);
      }
      // Chuyển date_added về dạng YYYY-MM-DD nếu đang là DD/MM/YYYY
      if (payload.date_added && payload.date_added.includes("/")) {
        const [day, month, year] = payload.date_added.split("/");
        payload.date_added = `${year}-${month}-${day}`;
      }
      // Log payload để debug
      console.log("Payload gửi lên:", payload);
      if (modalMode === "add") {
        await axios.post(API_URL, payload);
        toast.success("Thêm mới thành công!");
        setModalOpen(false); // Đóng modal sau khi thêm thành công
        fetchData();
      } else if (modalMode === "edit") {
        await axios.put(`${API_URL}${form.inventory_id}`, payload);
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
  const columns = getColumns(handlePreviewImage, handleAddDetail, handleEdit, handleDelete);

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

  // Thêm hàm fetch options
  const fetchCardOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const resp = await axios.get("http://localhost:8000/pokemon-cards/search-id-card", {
        params: { search: inputValue }
      });
      const data = resp.data as any[];
      return data.map((item: any) => ({
        value: item.master_card_id,
        label: item.master_card_id,
        image: item.reference_image_url
      }));
    } catch {
      return [];
    }
  };

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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label className="mac-input-label" style={{ alignSelf: "flex-start" }}>Mã thẻ</label>
          <div
            style={{
              position: "relative",
              width: "100%",
              marginTop: 2,
            }}
            className={form.master_card_id ? "mac-combobox mac-combobox--focused" : "mac-combobox"}
          >
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={fetchCardOptions}
              value={
                form.master_card_id
                  ? { value: form.master_card_id, label: form.master_card_id, image: form.reference_image_url }
                  : null
              }
              onChange={(option: { value: string; label: string; image?: string } | null) => {
                setForm(prev => ({
                  ...prev,
                  master_card_id: option?.value ?? "",
                  reference_image_url: option?.image ?? "",
                }));
                setFormTouched(true);
              }}
              placeholder="Nhập mã thẻ để tìm..."
              isClearable
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 40,
                  borderRadius: 10,
                  borderColor: state.isFocused ? "#90c2ff" : "#e0e0e0",
                  boxShadow: state.isFocused ? "0 0 0 3px #90c2ff44" : "none",
                  background: "#f7f7fa",
                  fontSize: 18,
                }),
                option: (base) => ({
                  ...base,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 16,
                }),
                singleValue: (base) => ({
                  ...base,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 18,
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: "#888",
                }),
                indicatorSeparator: () => ({
                  display: "none",
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: 10,
                  boxShadow: "0 4px 16px #0001",
                  fontSize: 16,
                }),
              }}
              formatOptionLabel={(option: { value: string; label: string; image?: string }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {option.image && (
                    <img src={option.image} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
                  )}
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>
        </div>
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label className="mac-input-label" style={{ alignSelf: "flex-start" }}>Ngày thêm</label>
          <input
        className="mac-input"
        name="date_added"
        type="date"
        value={
          form.date_added
            ? (() => {
            // Nếu đã là yyyy-mm-dd thì giữ nguyên, nếu là dd-mm-yyyy thì chuyển đổi
            if (/^\d{4}-\d{2}-\d{2}$/.test(form.date_added)) return form.date_added;
            const parts = form.date_added.split(/[-\/]/);
            if (parts.length === 3 && parts[2].length === 4) {
              // dd-mm-yyyy hoặc dd/mm/yyyy
              return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            }
            return form.date_added;
          })()
            : (() => {
            const d = new Date();
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${year}-${month}-${day}`;
          })()
        }
        onChange={handleFormChange}
        required
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label  className="mac-input-label" style={{ minWidth: 110 }}>Đang hoạt động</label>
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

  const fetchDetailInventory = async (inventory_id: number) => {
    try {
      const resp = await axios.get(`http://localhost:8000/detail-inventory/by-inventory/${inventory_id}`);
      setDetailData(prev => ({ ...prev, [inventory_id]: resp.data as any[] }));
    } catch {
      toast.error("Không thể tải chi tiết inventory!");
      setDetailData(prev => ({ ...prev, [inventory_id]: [] }));
    }
  };

  const detailColumns = [
    { key: "detail_id", label: "ID" },
    { key: "card_photos_count", label: "Số ảnh" },
    {
      key: "card_photos",
      label: "Ảnh",
      render: (row: any) => (
        <div className="d-flex gap-2 flex-wrap">
          {row.card_photos?.map((img: string, idx: number) => (
            <img
              key={idx}
              src={`/detail_inventory_images/${img}`}
              alt={`photo-${idx}`}
              style={{
                width: 36,
                height: 36,
                objectFit: "contain",
                borderRadius: 6,
                border: "1px solid #eee",
                cursor: "pointer"
              }}
              onClick={() => setPreviewImg(`/detail_inventory_images/${img}`)}
            />
          ))}
        </div>
      ),
    },
    { key: "physical_condition_us", label: "Điều kiện US" },
    { key: "physical_condition_jp", label: "Điều kiện JP" },
    {
      key: "is_graded",
      label: "Đã chấm điểm",
      render: (row: any) => row.is_graded ? "Đã chấm" : "Chưa chấm"
    },
    { key: "grade_company", label: "Hãng chấm" },
    { key: "grade_score", label: "Điểm" },
    {
      key: "purchase_price",
      label: "Giá mua",
      render: (row: any) => row.purchase_price ? row.purchase_price.toLocaleString("vi-VN") : "-"
    },
    {
      key: "selling_price",
      label: "Giá bán",
      render: (row: any) => row.selling_price ? row.selling_price.toLocaleString("vi-VN") : "-"
    },
    {
      key: "date_added",
      label: "Ngày thêm",
      render: (row: any) => row.date_added ? row.date_added.substring(0, 10) : "-"
    },
    {
      key: "last_updated",
      label: "Cập nhật cuối",
      render: (row: any) => row.last_updated ? row.last_updated.substring(0, 10) : "-"
    },
    {
      key: "is_sold",
      label: "Đã bán",
      render: (row: any) => row.is_sold ? "Đã bán" : "Chưa bán"
    },
    { key: "notes", label: "Ghi chú" },
    {
      key: "action",
      label: "Thao tác",
      render: (row: any) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-link p-0"
            title="Sửa"
            onClick={() => handleEditDetail(row)}
          >
            <i className="bi bi-pencil fs-6 text-warning"></i>
          </button>
          <button className="btn btn-link p-0" title="Xóa" onClick={() => handleDeleteDetail(row)}>
            <i className="bi bi-trash fs-6 text-danger"></i>
          </button>
        </div>
      ),
    },
  ];

  const renderDetailTable = (inventory_id: number) => {
    const details = (detailData[inventory_id] || []).map((row: any) => ({
      ...row,
      card_photos_count: row.card_photos?.length ?? 0,
    }));
    return (
      <div style={{ background: "#F7F7FA", borderRadius: 12, padding: 16 }}>
        <h6 className="fw-bold mb-2">Chi tiết thẻ</h6>
        <DataTable
          columns={detailColumns}
          data={details}
          pageSizeOptions={[5, 10]}
          totalRows={details.length}
          loading={false}
        />
      </div>
    );
  };

  const renderCollapse = (row: InventoryRow) => {
    // Nếu chưa có detail, fetch
    if (!detailData[row.inventory_id]) {
      fetchDetailInventory(row.inventory_id);
      return <div className="text-muted py-3">Đang tải chi tiết...</div>;
    }
    return renderDetailTable(row.inventory_id);
  };

  function handleAddDetail(row: InventoryRow) {
    setDetailForm({ ...defaultDetailForm, inventory_id: row.inventory_id });
    setDetailModalMode("add");
    setDetailModalOpen(true);
    setDetailFormTouched(false);
  }
  function handleEditDetail(row: any) {
    setDetailForm({ ...row });
    setDetailModalMode("edit");
    setDetailModalOpen(true);
    setDetailFormTouched(false);
  }
  async function handleSaveDetail() {
    try {
      let savedDetail: DetailInventoryForm | null = null;
      const { photo_count, ...payload } = detailForm;

      // Đảm bảo luôn gửi đủ trường bắt buộc
      const payloadFixed = {
        ...payload,
        detail_id: detailForm.detail_id,
        inventory_id: detailForm.inventory_id,
        grade_score: payload.grade_score === "" ? null : Number(payload.grade_score),
        purchase_price: payload.purchase_price === "" ? null : Number(payload.purchase_price),
        selling_price: payload.selling_price === "" ? null : Number(payload.selling_price),
        card_photos: Array.isArray(payload.card_photos) ? payload.card_photos : [],
        date_added: payload.date_added ? payload.date_added : new Date().toISOString().slice(0, 10),
        last_updated: new Date().toISOString(),
      };

      const url = `http://localhost:8000/detail-inventory/${detailForm.detail_id}`;
      const resp = await axios.put<DetailInventoryForm>(url, payloadFixed);
      toast.success("Cập nhật chi tiết thành công!");
      savedDetail = resp.data;

      // Nếu có ảnh thì upload
      if (detailImages.length > 0 && savedDetail) {
        const formData = new FormData();
        detailImages.forEach(img => formData.append("files", img.file, img.name));
        // angles lấy từ detailImages hoặc detailAngles nếu muốn dùng biến
        const angles = detailImages.map(img => img.name);
        console.log("Uploading images with angles:", angles);
        const query = new URLSearchParams({ inventory_id: String(savedDetail.inventory_id) });
        console.log("Query params before appending angles:", query.toString());
        angles.forEach(angle => query.append("angles", angle));
        setDetailAngles(angles); // Sử dụng biến detailAngles để lưu lại các góc ảnh đã upload
        console.log("FormData to be sent:", formData);
        await axios.post(
          `http://localhost:8000/detail-inventory/${savedDetail.detail_id}/upload-photos?${query.toString()}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success("Upload ảnh thành công!");
      }

      fetchDetailInventory(detailForm.inventory_id);
      setDetailModalOpen(false);
      setDetailImages([]);
      setDetailAngles([]);
    } catch {
      toast.error("Lỗi khi lưu chi tiết hoặc upload ảnh!");
    }
  }

  function handleDeleteDetail(row: any) {
    setConfirmMessage(`Bạn có chắc muốn xóa chi tiết ID ${row.detail_id}?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`http://localhost:8000/detail-inventory/${row.detail_id}`);
        toast.success("Xóa chi tiết thành công!");
        fetchDetailInventory(row.inventory_id);
      } catch {
        toast.error("Lỗi khi xóa chi tiết!");
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  }
  

  function handleDetailFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setDetailForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setDetailFormTouched(true);
  }

  function handleDetailSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target;
    setDetailForm((prev) => {
      let next = { ...prev, [name]: value };
      if (name === "physical_condition_us") {
        next.physical_condition_jp = US_TO_JP[value] || "";
      } else if (name === "physical_condition_jp") {
        next.physical_condition_us = JP_TO_US[value] || "";
      }
      return next;
    });
    setDetailFormTouched(true);
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
        renderCollapse={renderCollapse}
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
      {/* Modal xem ảnh chi tiết đã upload */}
      <Modal
        isOpen={!!previewImg}
        onClose={() => setPreviewImg(null)}
        title="Xem ảnh"
      >
        {previewImg && (
          <img
            src={previewImg}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: 500,
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 8px 32px #0003",
              background: "#fff"
            }}
          />
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
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalMode === "add" ? "Thêm chi tiết thẻ" : "Sửa chi tiết thẻ"}
      >
        <form
          autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); handleSaveDetail(); }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, minWidth: 600 }}
        >
          {/* --- Cột 1: Upload ảnh và xem trước --- */}
          <div style={{ gridColumn: "1/2", display: "flex", flexDirection: "column", gap: 12 }}>
            <label className="mac-input-label">Ảnh chi tiết (có thể chọn nhiều)</label>
            {/* Khu vực hình vuông hiển thị ảnh đã upload + nút "+" */}
            <div
              style={{
                width: 900,
                height: 600,
                background: "#f7f7fa",
                borderRadius: 12,
                border: "1px solid #eee",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gap: 16,
                padding: 16,
                position: "relative"
              }}
            >
              {/* Hiển thị ảnh đã có trong detailForm.card_photos */}
              {detailForm.card_photos && detailForm.card_photos.map((img: string, idx: number) => (
                <div
                  key={`existing-${idx}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Nút xóa cho ảnh đã lưu */}
                  <button
                    type="button"
                    onClick={() => {
                      setDetailForm(prev => ({
                        ...prev,
                        card_photos: prev.card_photos.filter((_, i) => i !== idx)
                      }));
                      setDetailFormTouched(true);
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 10,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.25)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: "50%",
                      width: 28,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Xóa ảnh này"
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: 18, color: "#fff" }}></i>
                  </button>
                  <img
                    src={`/detail_inventory_images/${img}`}
                    alt={`photo-${idx}`}
                    style={{
                      width: "100%",
                      height: "80%",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                    onClick={() => setPreviewImg(`/detail_inventory_images/${img}`)}
                  />
                  <span style={{ marginTop: 4, fontSize: 14, color: "#555" }}>{img}</span>
                </div>
              ))}
              {/* Hiển thị ảnh vừa upload (chưa lưu) */}
              {detailImages.map((img, idx) => (
                <div
                  key={`upload-${idx}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const ANGLES = ["front", "back", "corner1", "corner2", "corner3", "corner4", "corner5", "corner6", "corner7", "corner8"];
                      setDetailImages(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({
                        ...item,
                        name: ANGLES[i] || `angle${i + 1}`
                      })));
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 10,
                      zIndex: 2,
                      background: "rgba(255,255,255,0.25)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: "50%",
                      width: 28,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Xóa ảnh này"
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: 18, color: "#fff" }}></i>
                  </button>
                  <img
                    src={URL.createObjectURL(img.file)}
                    alt={`preview-${idx}`}
                    style={{
                      width: "100%",
                      height: "80%",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />
                  <input
                    type="text"
                    value={img.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setDetailImages(prev => prev.map((item, i) => i === idx ? { ...item, name: newName } : item));
                    }}
                    style={{
                      marginTop: 4,
                      width: "100%",
                      fontSize: 14,
                      textAlign: "center",
                      border: "1px solid #eee",
                      background: "#fff",
                      color: "#333"
                    }}
                  />
                </div>
              ))}
              {/* Nút + để chọn ảnh, chỉ hiện nếu chưa đủ 10 ảnh upload */}
              {detailImages.length < 10 && (
                <label
                  htmlFor="detail-image-upload"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fff",
                    border: "1px dashed #bbb",
                    borderRadius: 8,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    minWidth: 0,
                    gridColumn: ((detailForm.card_photos?.length ?? 0) + detailImages.length) % 5 + 1,
                    gridRow: Math.floor(((detailForm.card_photos?.length ?? 0) + detailImages.length) / 5) + 1,
                  }}
                  title="Thêm ảnh"
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: 48, color: "#bbb" }}></i>
                </label>
              )}
              <input
                id="detail-image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  const ANGLES = ["front", "back", "corner1", "corner2", "corner3", "corner4", "corner5", "corner6", "corner7", "corner8"];
                  setDetailImages(prev => {
                    const allFiles = [...prev, ...files.map(f => ({ file: f, name: "" }))].slice(0, 10);
                    return allFiles.map((item, idx) => ({
                      ...item,
                      name: ANGLES[idx] || `angle${idx + 1}`
                    }));
                  });
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </div>
            
          </div>

          {/* --- Cột 2: Các trường thông tin khác --- */}
          <div style={{ gridColumn: "2/3", display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              label="Giá mua"
              name="purchase_price"
              type="money"
              value={detailForm.purchase_price}
              onChange={handleDetailFormChange}
            />
            <Input
              label="Giá bán"
              name="selling_price"
              type="money"
              value={detailForm.selling_price}
              onChange={handleDetailFormChange}
            />
            <Input
              label="Ngày thêm"
              name="date_added"
              type="date"
              value={detailForm.date_added}
              onChange={handleDetailFormChange}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label className="mac-input-label" style={{ minWidth: 110 }}>Đã chấm điểm</label>
              <Toggle
                checked={detailForm.is_graded}
                onChange={(checked) => setDetailForm((prev) => ({ ...prev, is_graded: checked }))}
              />
              <label className="mac-input-label">Công ty chấm</label>
              <Input
                name="grade_company"
                type="text"
                value={detailForm.grade_company}
                onChange={handleDetailFormChange}
                disabled={!detailForm.is_graded}
                style={{ width: 140, marginLeft: 16 }}
              />
              <label className="mac-input-label">Số điểm</label>
              <Input
                name="grade_score"
                type="number"
                value={detailForm.grade_score}
                onChange={handleDetailFormChange}
                min={0}
                max={10}
                disabled={!detailForm.is_graded}
                style={{ width: 100, marginLeft: 8 }}
              />
            </div>
            <Input
              label="Ghi chú"
              name="notes"
              type="text"
              value={detailForm.notes}
              onChange={handleDetailFormChange}
            />
            {/* Hai combobox nằm cùng hàng */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <label className="mac-input-label">Điều kiện US</label>
                <select
                  name="physical_condition_us"
                  value={US_OPTIONS.some(opt => opt.value === detailForm.physical_condition_us) ? detailForm.physical_condition_us : ""}
                  onChange={handleDetailSelectChange}
                  className="mac-input"
                  required
                >
                  <option value="">Chọn...</option>
                  {US_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="mac-input-label">Điều kiện JP</label>
                <select
                  name="physical_condition_jp"
                  value={detailForm.physical_condition_jp}
                  onChange={handleDetailSelectChange}
                  className="mac-input"
                  required
                >
                  <option value="">Chọn...</option>
                  {JP_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nút lưu/đóng */}
          <div style={{ gridColumn: "2/3", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button type="submit" variant="primary">Lưu</Button>
            <Button type="button" variant="gray-outline" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;