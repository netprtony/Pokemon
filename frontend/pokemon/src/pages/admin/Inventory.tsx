import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "../../assets/css/Inventory.css";
import type { FieldOption, Filter } from "../../components/AdvancedFilters";
import AdvancedFilters from "../../components/AdvancedFilters";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import DataTable from "../../components/Table";
import Toggle from "../../components/Toggle";

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
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
      2,
      "0"
    )}`;
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
          {
            params: {
              page,
              page_size: pageSize,
              sort_field: sortField,
              sort_order: sortOrder,
            },
          }
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
            sort_field: sortField,
            sort_order: sortOrder,
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
  }, [filters, searchTerm, page, pageSize, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
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
          style={{
            width: 36,
            height: 36,
            objectFit: "contain",
            cursor: "pointer",
          }}
          onClick={() =>
            row.reference_image_url &&
            handlePreviewImage(row.reference_image_url)
          }
        />
      ) : (
        <img
          alt="No image"
          style={{ width: 36, height: 36, objectFit: "contain", opacity: 0.5 }}
        />
      
      ),
    width: 50,
    align: "center" as const,
    sticky: true,
  },
  { key: "inventory_id", label: "ID", sticky: true },
  { key: "master_card_id", label: "Mã thẻ", sticky: true },
  { key: "total_quantity", label: "Số lượng", sticky: true },
  { key: "quantity_sold", label: "Đã bán", sticky: true },
  { key: "avg_purchase_price", label: "Giá mua TB", sticky: true },
  { key: "avg_selling_price", label: "Giá bán TB", sticky: true },
  { key: "storage_location", label: "Vị trí lưu trữ", sticky: true },
  { key: "language", label: "Ngôn ngữ", sticky: true },
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
    sticky: true,
  },
  { key: "date_added", label: "Ngày thêm", sticky: true },
  { key: "last_updated", label: "Cập nhật cuối", sticky: true },
  { key: "notes", label: "Ghi chú", sticky: true },
  {
    key: "action",
    label: "Thao tác",
    align: "center" as const,
    width: 110,
    render: (row: InventoryRow) => (
      <div className="d-flex justify-content-center gap-3">
        <button
          className="btn btn-link p-0"
          title="Thêm chi tiết kho"
          onClick={() => handleAddDetail(row)}
        >
          <i className="bi bi-plus fs-5 text-success"></i>
        </button>
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
    sticky: true,
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
    filters,
    searchTerm,
    page,
    pageSize,
    sortField,
    sortOrder,
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
  const [detailModalMode, setDetailModalMode] = useState<"add" | "edit" | null>(
    null
  );
  const [detailFormTouched, setDetailFormTouched] = useState(false);

  const [detailImages, setDetailImages] = React.useState<
    { file: File; name: string }[]
  >([]);
  const [detailAngles, setDetailAngles] = React.useState<string[]>([]);

  const [cardSearch, setCardSearch] = useState("");
  const [cardOptions, setCardOptions] = useState<
    {
      value: string;
      label: string;
      image?: string;
      name_en?: string;
      name_original?: string;
      card_number?: string;
    }[]
  >([]);
  const [cardDropdown, setCardDropdown] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Thêm state:
  const [openedInventoryId, setOpenedInventoryId] = useState<number | null>(null);
  const [priceData, setPriceData] = useState<any | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // --- Effect: gọi API khi openedInventoryId thay đổi ---
  useEffect(() => {
    if (openedInventoryId !== null) {
      // Tìm inventory row đang mở
      const row = data.find((r) => r.inventory_id === openedInventoryId);
      if (row) fetchPriceData(row);
    } else {
      setPriceData(null);
    }
    // eslint-disable-next-line
  }, [openedInventoryId]);

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
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, files, checked, dataset } =
      e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files?.[0] ?? null
          : dataset?.type === "money"
          ? value === ""
            ? 0
            : Number(value) // ✅ ép về number
          : type === "number"
          ? value === ""
            ? 0
            : Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
    setFormTouched(true);
  };
  const handlePreviewImage = (url: string) => setPreviewImg(url);

  // Table columns
  const columns = getColumns(
    handlePreviewImage,
    handleAddDetail,
    handleEdit,
    handleDelete
  );

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

  // Sửa lại hàm fetchCardOptions chỉ chạy khi bấm nút
  const fetchCardOptions = async () => {
    if (!cardSearch) return;
    try {
      const resp = await axios.get(
        "http://localhost:8000/pokemon-cards/search-id-card",
        {
          params: { search: cardSearch },
        }
      );
      const data = resp.data as any[];
      setCardOptions(
        data.map((item: any) => ({
          value: item.master_card_id,
          label: item.master_card_id,
          image: item.reference_image_url,
          name_en: item.name_en,
          name_original: item.name_original,
          card_number: item.card_number,
          // Thêm các trường khác nếu cần
        }))
      );
      setCardDropdown(true);
    } catch {
      setCardOptions([]);
      setCardDropdown(true);
    }
  };

  // Form modal content
  const renderFormModal = () => (
    <form
      className="inventory-modal-form"
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
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
      <div
        style={{
          gridColumn: "1/2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>
          Ảnh đại diện thẻ
        </label>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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
              onClick={() =>
                form.reference_image_url &&
                handlePreviewImage(form.reference_image_url)
              }
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
      <div
        style={{
          gridColumn: "2/3",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            className="mac-input-label"
            style={{ alignSelf: "flex-start" }}
          >
            Mã thẻ
          </label>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              position: "relative",
            }}
          >
            <input
              ref={cardInputRef}
              className="mac-input"
              style={{ minWidth: 500, fontSize: 18 }}
              value={cardSearch}
              onChange={(e) => {
                setCardSearch(e.target.value);
                setCardDropdown(false);
              }}
              placeholder="Nhập mã thẻ để tìm..."
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchCardOptions();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 16px", fontSize: 16 }}
              onClick={fetchCardOptions}
              tabIndex={-1}
            >
              <i className="bi bi-search"></i>
            </button>
            {/* Dropdown kết quả */}
            {cardDropdown && cardOptions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  left: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px #0001",
                  minWidth: 500,
                  maxHeight: 650,
                  overflowY: "auto",
                }}
              >
                {cardOptions.map((opt) => (
                  <div
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f2f2f2",
                    }}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        master_card_id: opt.value,
                        reference_image_url: opt.image ?? "",
                      }));
                      setCardSearch(opt.value);
                      setCardDropdown(false);
                      setFormTouched(true);
                    }}
                  >
                    {opt.image && (
                      <img
                        src={opt.image}
                        alt=""
                        style={{
                          width: 68,
                          height: 68,
                          objectFit: "contain",
                          borderRadius: 6,
                          background: "#fafbfc",
                          border: "1px solid #eee",
                        }}
                      />
                    )}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 17 }}>
                        {opt.value}
                      </span>
                      {opt.name_en && (
                        <span style={{ color: "#1976d2", fontSize: 15 }}>
                          {opt.name_en}
                        </span>
                      )}
                      {opt.card_number && (
                        <span style={{ color: "#888", fontSize: 14 }}>
                          #{opt.card_number}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <label
            className="mac-input-label"
            style={{ alignSelf: "flex-start" }}
          >
            Ngôn ngữ
          </label>
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
      <div
        style={{
          gridColumn: "3/4",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
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
          <label
            className="mac-input-label"
            style={{ alignSelf: "flex-start" }}
          >
            Ngày thêm
          </label>
          <input
            className="mac-input"
            name="date_added"
            type="date"
            value={
              formatDate(form.date_added || "") ||
              (() => {
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
          <label className="mac-input-label" style={{ minWidth: 110 }}>
            Đang hoạt động
          </label>
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
          alignSelf: "end",
        }}
      >
        <Button type="submit" variant="primary" size="md">
          {modalMode === "add" ? "Thêm mới" : "Lưu thay đổi"}
        </Button>
        <Button
          type="button"
          variant="gray-outline"
          size="md"
          onClick={handleCloseModal}
        >
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
      const resp = await axios.get(
        `http://localhost:8000/detail-inventory/by-inventory/${inventory_id}`
      );
      // Parse card_photos nếu là string JSON
      const fixedData = (resp.data as any[]).map((row) => ({
        ...row,
        card_photos:
          typeof row.card_photos === "string"
            ? (() => {
                try {
                  const arr = JSON.parse(row.card_photos);
                  return Array.isArray(arr) ? arr : [];
                } catch {
                  return [];
                }
              })()
            : Array.isArray(row.card_photos)
            ? row.card_photos
            : [],
      }));
      setDetailData((prev) => ({ ...prev, [inventory_id]: fixedData }));
    } catch {
      toast.error("Không thể tải chi tiết inventory!");
      setDetailData((prev) => ({ ...prev, [inventory_id]: [] }));
    }
  };

  const detailColumns = [
    { key: "detail_id", label: "ID", sticky: true },
    { key: "card_photos_count", label: "Số ảnh" , sticky: true},
    {
      key: "card_photos",
      label: "Ảnh",
      render: (row: any) => (
        <div className="d-flex gap-2 flex-wrap">
          {Array.isArray(row.card_photos) && row.card_photos.length > 0 ? (
            row.card_photos.map((img: string, idx: number) => (
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
                  cursor: "pointer",
                }}
                onClick={() => setPreviewImg(`/detail_inventory_images/${img}`)}
              />
            ))
          ) : (
            <span className="text-muted" style={{ fontSize: 13 }}>
              Không có ảnh
            </span>
          )}
        </div>
      ),
      sticky: true,
    },
    { key: "physical_condition_us", label: "Điều kiện US", sticky: true },
    { key: "physical_condition_jp", label: "Điều kiện JP", sticky: true },
    {
      key: "is_graded",
      label: "Đã chấm điểm",
      render: (row: any) => (row.is_graded ? "Đã chấm" : "Chưa chấm"),
      sticky: true,
    },
    { key: "grade_company", label: "Hãng chấm", sticky: true },
    { key: "grade_score", label: "Điểm", sticky: true },
    {
      key: "purchase_price",
      label: "Giá mua",
      render: (row: any) =>
        row.purchase_price ? row.purchase_price.toLocaleString("vi-VN") : "-",
      sticky: true
    },
    {
      key: "selling_price",
      label: "Giá bán",
      render: (row: any) =>
        row.selling_price ? row.selling_price.toLocaleString("vi-VN") : "-",
      sticky: true
    },
    {
      key: "date_added",
      label: "Ngày thêm",
      render: (row: any) =>
        row.date_added ? row.date_added.substring(0, 10) : "-",
      sticky: true
    },
    {
      key: "last_updated",
      label: "Cập nhật cuối",
      render: (row: any) =>
        row.last_updated ? row.last_updated.substring(0, 10) : "-",
      sticky: true
    },
    {
      key: "is_sold",
      label: "Đã bán",
      render: (row: any) => (row.is_sold ? "Đã bán" : "Chưa bán"),
      sticky: true
    },
    { key: "notes", label: "Ghi chú", sticky: true },
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
          <button
            className="btn btn-link p-0"
            title="Xóa"
            onClick={() => handleDeleteDetail(row)}
          >
            <i className="bi bi-trash fs-6 text-danger"></i>
          </button>
        </div>
      ),
      sticky: true
    },
  ];

  const renderDetailTable = (inventory_id: number) => {
    const details = (detailData[inventory_id] || []).map((row: any) => ({
      ...row,
      card_photos_count: row.card_photos?.length ?? 0,
    }));
    return (
      <div style={{ background: "#F7F7FA", borderRadius: 12, padding: 16 }}>
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

  // --- renderCollapse chỉ là hàm render, KHÔNG dùng hook ---
  const renderCollapse = (row: InventoryRow) => (
    <div>
      {/* {renderPriceBox()} */}
      {renderDetailTable(row.inventory_id)}
    </div>
  );

  function handleAddDetail(row: InventoryRow) {
    setDetailForm({ ...defaultDetailForm, inventory_id: row.inventory_id });
    setDetailModalMode("add");
    setDetailModalOpen(true);
    setDetailFormTouched(false);
  }
  function handleEditDetail(row: any) {
    // Nếu giá trị không hợp lệ, set về giá trị đầu tiên trong US_OPTIONS
    const validUS = US_OPTIONS.map((opt) => opt.value);
    const usValue = validUS.includes(row.physical_condition_us)
      ? row.physical_condition_us
      : validUS[0];
    setDetailForm({ ...row, physical_condition_us: usValue });
    setDetailModalMode("edit");
    setDetailModalOpen(true);
    setDetailFormTouched(false);
  }
  async function handleSaveDetail() {
    try {
      let savedDetail: DetailInventoryForm | null = null;
      const { detail_id, inventory_id, date_added, photo_count, ...payload } =
        detailForm;

      // Đảm bảo card_photos luôn là mảng chuỗi
      let card_photos: string[] = [];
      if (Array.isArray(payload.card_photos)) {
        card_photos = payload.card_photos.map(String);
      } else if (
        typeof payload.card_photos === "string" &&
        payload.card_photos
      ) {
        try {
          const arr = JSON.parse(payload.card_photos);
          card_photos = Array.isArray(arr) ? arr.map(String) : [];
        } catch {
          card_photos = [];
        }
      }

      const card_photos_count = card_photos.length;

      // Xử lý các trường số: nếu rỗng thì set null, nếu có thì ép kiểu số
      const grade_score =
        payload.grade_score === "" || payload.grade_score === null
          ? null
          : Number(payload.grade_score);
      const purchase_price =
        payload.purchase_price === "" || payload.purchase_price === null
          ? null
          : Number(payload.purchase_price);
      const selling_price =
        payload.selling_price === "" || payload.selling_price === null
          ? null
          : Number(payload.selling_price);

      // Payload gửi lên BE
      const payloadFixed = {
        ...payload,
        card_photos, // luôn là mảng chuỗi
        card_photos_count,
        photo_count: card_photos_count,
        grade_score,
        purchase_price,
        selling_price,
        last_updated: new Date().toISOString(),
      };

      let url = `http://localhost:8000/detail-inventory/${detailForm.detail_id}`;
      let resp;
      if (detailForm.detail_id === 0) {
        url = "http://localhost:8000/detail-inventory/";
        resp = await axios.post<DetailInventoryForm>(url, {
          ...payloadFixed,
          inventory_id: detailForm.inventory_id,
          date_added: detailForm.date_added,
        });
        toast.success("Thêm chi tiết thành công!");
      } else {
        resp = await axios.put<DetailInventoryForm>(url, payloadFixed);
        toast.success("Cập nhật chi tiết thành công!");
      }
      savedDetail = resp.data;

      // Nếu có ảnh thì upload
      if (detailImages.length > 0 && savedDetail) {
        const formData = new FormData();
        detailImages.forEach((img) =>
          formData.append("files", img.file, img.name)
        );
        const angles = detailImages.map((img) => img.name);
        const query = new URLSearchParams({
          inventory_id: String(savedDetail.inventory_id),
        });
        angles.forEach((angle) => query.append("angles", angle));
        await axios.post(
          `http://localhost:8000/detail-inventory/${
            savedDetail.detail_id
          }/upload-photos?${query.toString()}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success("Upload ảnh thành công!");
      }

      fetchDetailInventory(detailForm.inventory_id);
      setDetailModalOpen(false);
      setDetailImages([]);
      setDetailAngles([]);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        // Nếu detail là object, stringify để dễ debug
        const msg =
          typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
        toast.error("Lỗi: " + msg);
      } else {
        toast.error("Lỗi khi lưu chi tiết hoặc upload ảnh!");
      }
    }
  }

  function handleDeleteDetail(row: any) {
    setConfirmMessage(`Bạn có chắc muốn xóa chi tiết ID ${row.detail_id}?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(
          `http://localhost:8000/detail-inventory/${row.detail_id}`
        );
        toast.success("Xóa chi tiết thành công!");
        fetchDetailInventory(row.inventory_id);
      } catch {
        toast.error("Lỗi khi xóa chi tiết!");
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  }

  function handleDetailFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
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

  const fetchPriceData = async (row: InventoryRow) => {
    setPriceLoading(true);
    try {
      const resp = await axios.get(
        `http://localhost:8000/market-price/by-master/${row.master_card_id}`
      );
      setPriceData(resp.data); // resp.data đã đúng kiểu như bạn yêu cầu
    } catch {
      setPriceData(null);
    }
    setPriceLoading(false);
  };

 const renderPriceBox = () => {
    if (priceLoading)
      return (
        <div className="py-3">
          Đang tải giá...
          <div className="progress mt-2" style={{ height: 6, maxWidth: 320 }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-info"
              role="progressbar"
              style={{ width: "100%" }}
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
      );
    if (!priceData) return null;

    // Lấy các giá trị grade từ pricecharting_price
    const grades = [
      "Ungraded",
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 9.5",
      "Grade 10",
      "PSA 10",
      "TAG 10",
      "ACE 10",
      "SGC 10",
      "CGC 10",
      "BGS 10",
      "BGS 10 Black",
      "CGC 10 Pristine",
    ];
    const pricecharting = priceData.pricecharting_price || {};

    // Lấy các url nguồn từ priceData.url
    const urlObj = priceData.url || {};
    const urlOptions = [
      urlObj.eBay_link_table_1 && {
        label: "eBay",
        url: urlObj.eBay_link_table_1,
        price: priceData.ebay_avg_price,
      },
      urlObj.TCGPlayer_link_table_1 && {
        label: "TCGPlayer",
        url: urlObj.TCGPlayer_link_table_1,
        price: priceData.tcgplayer_price,
      },  
      urlObj.url && {
        label: "PriceCharting",
        url: urlObj.url,
        price: "",
      },
    ].filter(Boolean);

    return (
      <div className="price-box" style={{ padding: 12 }}>
        <div style={{ overflowX: "auto", width: "77%" }}>
          <table
            className="table table-bordered"
            style={{ tableLayout: "fixed", width: "100%", fontSize: 14 }}
          >
            <thead>
              <tr>
                {grades.map((g) => (
                  <th key={g} style={{ width: 90 }}>{g}</th>
                ))}
                <th style={{ width: 180 }}>Links</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {grades.map((g) => (
                    <td key={g}>
                    {pricecharting[g] !== undefined && pricecharting[g] !== null
                      ? pricecharting[g] === "-"
                      ? "-"
                      : `$${pricecharting[g]}`
                      : "-"}
                    </td>
                ))}
                <td>
                  <select
                    style={{ minWidth: 160 }}
                    onChange={(e) => {
                      const url = e.target.value;
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    <option value="">Chọn nguồn giá...</option>
                    {urlOptions.map((opt) => (
                      <option key={opt.label} value={opt.url}>
                        {opt.label}
                        {opt.price ? ` (${opt.price})` : ""}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
      <div className="d-flex justify-content-center mb-3">
        <button className="btn btn-success" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-2"></i> Thêm thẻ mới
        </button>
      </div>
      {/* Hiển thị khung bảng giá ngay dưới nút Thêm thẻ mới */}
      {renderPriceBox()}
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
        onCollapseOpen={(row) => setOpenedInventoryId(row.inventory_id)}
        onCollapseClose={() => {
          setOpenedInventoryId(null);
          setPriceData(null);
        }}
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
        zIndex={9999}
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
              background: "#fff",
            }}
          />
        )}
      </Modal>
      <Modal
        isOpen={previewImgs.length > 0}
        onClose={() => setPreviewImgs([])}
        title="Xem tất cả ảnh"
        zIndex={9999}
      >
        <div className="d-flex flex-wrap gap-3">
          {previewImgs.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Preview ${idx}`}
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid #eee",
              }}
            />
          ))}
        </div>
      </Modal>
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={
          detailModalMode === "add" ? "Thêm chi tiết thẻ" : "Sửa chi tiết thẻ"
        }
      >
        <form
          className="detail-modal-form"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveDetail();
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            minWidth: 600,
          }}
        >
          {/* --- Cột 1: Upload ảnh và xem trước --- */}
          <div
            style={{
              gridColumn: "1/2",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <label className="mac-input-label">
              Ảnh chi tiết (có thể chọn nhiều)
            </label>
            {/* Khu vực hình vuông hiển thị ảnh đã upload + nút "+" */}
            <div
              style={{
                width: 800,
                height: 600,
                background: "#222",
                borderRadius: 12,
                border: "1px solid #eee",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gap: 16,
                padding: 16,
                position: "relative",
              }}
            >
              {/* Hiển thị ảnh đã có trong detailForm.card_photos */}
              {detailForm.card_photos &&
                detailForm.card_photos.map((img: string, idx: number) => (
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
                        setDetailForm((prev) => ({
                          ...prev,
                          card_photos: prev.card_photos.filter(
                            (_, i) => i !== idx
                          ),
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
                      <i
                        className="bi bi-x-lg"
                        style={{ fontSize: 18, color: "#fff" }}
                      ></i>
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
                      onClick={() =>
                        setPreviewImg(`/detail_inventory_images/${img}`)
                      }
                    />
                    <span style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
                      {img}
                    </span>
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
                      const ANGLES = [
                        "front",
                        "back",
                        "corner1",
                        "corner2",
                        "corner3",
                        "corner4",
                        "corner5",
                        "corner6",
                        "corner7",
                        "corner8",
                      ];
                      setDetailImages((prev) =>
                        prev
                          .filter((_, i) => i !== idx)
                          .map((item, i) => ({
                            ...item,
                            name: ANGLES[i] || `angle${i + 1}`,
                          }))
                      );
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
                    <i
                      className="bi bi-x-lg"
                      style={{ fontSize: 18, color: "#fff" }}
                    ></i>
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
                    onChange={(e) => {
                      const newName = e.target.value;
                      setDetailImages((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, name: newName } : item
                        )
                      );
                    }}
                    style={{
                      marginTop: 4,
                      width: "100%",
                      fontSize: 14,
                      textAlign: "center",
                      border: "1px solid #eee",
                      background: "#fff",
                      color: "#333",
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
                    background: "#495057",
                    border: "1px dashed #bbb",
                    borderRadius: 8,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    minWidth: 0,
                    gridColumn:
                      (((detailForm.card_photos?.length ?? 0) +
                        detailImages.length) %
                        5) +
                      1,
                    gridRow:
                      Math.floor(
                        ((detailForm.card_photos?.length ?? 0) +
                          detailImages.length) /
                          5
                      ) + 1,
                  }}
                  title="Thêm ảnh"
                >
                  <i
                    className="bi bi-plus-lg"
                    style={{ fontSize: 48, color: "#bbb" }}
                  ></i>
                </label>
              )}
              <input
                id="detail-image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const ANGLES = [
                    "front",
                    "back",
                    "corner1",
                    "corner2",
                    "corner3",
                    "corner4",
                    "corner5",
                    "corner6",
                    "corner7",
                    "corner8",
                  ];
                  setDetailImages((prev) => {
                    const allFiles = [
                      ...prev,
                      ...files.map((f) => ({ file: f, name: "" })),
                    ].slice(0, 10);
                    return allFiles.map((item, idx) => ({
                      ...item,
                      name: ANGLES[idx] || `angle${idx + 1}`,
                    }));
                  });
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* --- Cột 2: Các trường thông tin khác --- */}
          <div
            style={{
              gridColumn: "2/3",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
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
              <label className="mac-input-label" style={{ minWidth: 110 }}>
                Đã chấm điểm
              </label>
              <Toggle
                checked={detailForm.is_graded}
                onChange={(checked) =>
                  setDetailForm((prev) => ({ ...prev, is_graded: checked }))
                }
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
                  value={detailForm.physical_condition_us} // SỬA: set trực tiếp giá trị
                  onChange={handleDetailSelectChange}
                  className="mac-input"
                  required
                >
                  <option value="">Chọn...</option>
                  {US_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
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
                  {JP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nút lưu/đóng */}
          <div
            style={{
              gridColumn: "2/3",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button type="submit" variant="primary">
              Lưu
            </Button>
            <Button
              type="button"
              variant="gray-outline"
              onClick={() => setDetailModalOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
