import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng PokemonCard
export type PokemonCardRow = {
  master_card_id: string;
  set_id: string;
  card_number: string;
  name_en: string;
  name_original?: string;
  version_en?: string;
  version_original?: string;
  supertype: string;
  subtypes?: string;
  rarity: string;
  illustrator?: string;
  reference_image_url?: string;
  flavorText?: string;
  updated_at?: string;
};

// Field options cho filter
const fieldOptions: FieldOption[] = [
  { value: "master_card_id", label: "Master Card ID", type: "text" },
  { value: "set_id", label: "Set ID", type: "text" },
  { value: "card_number", label: "Số thẻ", type: "text" },
  { value: "name_en", label: "Tên (EN)", type: "text" },
  { value: "name_original", label: "Tên gốc", type: "text" },
  { value: "version_en", label: "Phiên bản (EN)", type: "text" },
  { value: "version_original", label: "Phiên bản gốc", type: "text" },
  { value: "supertype", label: "Supertype", type: "text" },
  { value: "subtypes", label: "Subtypes", type: "text" },
  { value: "rarity", label: "Độ hiếm", type: "text" },
  { value: "illustrator", label: "Họa sĩ", type: "text" },
  { value: "reference_image_url", label: "Hình tham khảo", type: "text" },
  { value: "flavorText", label: "Flavor Text", type: "text" },
  { value: "updated_at", label: "Ngày cập nhật", type: "date" },
];

const API_URL = "http://localhost:8000/pokemon-cards";

type ModalMode = "add" | "edit" | null;

const defaultForm: PokemonCardRow = {
  master_card_id: "",
  set_id: "",
  card_number: "",
  name_en: "",
  name_original: "",
  version_en: "",
  version_original: "",
  supertype: "",
  subtypes: "",
  rarity: "",
  illustrator: "",
  reference_image_url: "",
  flavorText: "",
  updated_at: "",
};

const PokemonCardPage: React.FC = () => {
  const [data, setData] = useState<PokemonCardRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<PokemonCardRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  // Xử lý upload ảnh
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [sortField, setSortField] = useState("master_card_id");
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
        const data = resp.data as { items: PokemonCardRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: PokemonCardRow[]; total: number }>(API_URL, {
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
    setUploadFile(null);
  };

  // Sửa
  const handleEdit = (row: PokemonCardRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
    setUploadFile(null);
  };

  // Xóa
  const handleDelete = (row: PokemonCardRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa thẻ "${row.name_en}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.master_card_id}`);
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
        await axios.put(`${API_URL}/${form.master_card_id}`, form);
        toast.success("Cập nhật thành công!");
      }
      // Nếu có upload ảnh
      if (uploadFile && form.master_card_id) {
        const fd = new FormData();
        fd.append("file", uploadFile);
        await axios.post(`${API_URL}/${form.master_card_id}/upload-image`, fd);
        toast.success("Upload hình thành công!");
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

  // Xử lý upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setFormTouched(true);
    }
  };

  // Table columns
  const columns = [
    {
      key: "reference_image_url",
      label: "",
      render: (row: PokemonCardRow) =>
        row.reference_image_url ? (
          <img
            src={row.reference_image_url}
            alt={row.name_en}
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        ) : (
          <i className="bi bi-image text-secondary fs-3" title="No image" />
        ),
      width: 50,
      align: "center" as const,
      onSort: () => {},
      sortActive: sortField === "reference_image_url",
      sortDirection: sortOrder,
    },
    { key: "master_card_id", label: "Master Card ID", onSort: () => {}, sortActive: sortField === "master_card_id", sortDirection: sortOrder },
    { key: "set_id", label: "Set ID", onSort: () => {}, sortActive: sortField === "set_id", sortDirection: sortOrder },
    { key: "card_number", label: "Số thẻ", onSort: () => {}, sortActive: sortField === "card_number", sortDirection: sortOrder },
    { key: "name_en", label: "Tên (EN)", onSort: () => {}, sortActive: sortField === "name_en", sortDirection: sortOrder },
    { key: "name_original", label: "Tên gốc", onSort: () => {}, sortActive: sortField === "name_original", sortDirection: sortOrder },
    { key: "version_en", label: "Phiên bản (EN)", onSort: () => {}, sortActive: sortField === "version_en", sortDirection: sortOrder },
    { key: "version_original", label: "Phiên bản gốc", onSort: () => {}, sortActive: sortField === "version_original", sortDirection: sortOrder },
    { key: "supertype", label: "Supertype", onSort: () => {}, sortActive: sortField === "supertype", sortDirection: sortOrder },
    { key: "subtypes", label: "Subtypes", onSort: () => {}, sortActive: sortField === "subtypes", sortDirection: sortOrder },
    { key: "rarity", label: "Độ hiếm", onSort: () => {}, sortActive: sortField === "rarity", sortDirection: sortOrder },
    { key: "illustrator", label: "Họa sĩ", onSort: () => {}, sortActive: sortField === "illustrator", sortDirection: sortOrder },
    {
      key: "flavorText",
      label: "Flavor Text",
      render: (row: PokemonCardRow) => row.flavorText || "-",
      onSort: () => {},
      sortActive: sortField === "flavorText",
      sortDirection: sortOrder,
    },
    {
      key: "updated_at",
      label: "Ngày cập nhật",
      render: (row: PokemonCardRow) =>
        row.updated_at
          ? new Date(row.updated_at).toLocaleString("vi-VN")
          : "-",
      onSort: () => {},
      sortActive: sortField === "updated_at",
      sortDirection: sortOrder,
    },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: PokemonCardRow, _idx: number) => (
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
        <label className="form-label fw-semibold">Master Card ID</label>
        <input
          className="form-control"
          name="master_card_id"
          value={form.master_card_id}
          onChange={handleFormChange}
          disabled={modalMode === "edit"}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Set ID</label>
        <input
          className="form-control"
          name="set_id"
          value={form.set_id}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Số thẻ</label>
        <input
          className="form-control"
          name="card_number"
          value={form.card_number}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tên (EN)</label>
        <input
          className="form-control"
          name="name_en"
          value={form.name_en}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Tên gốc</label>
        <input
          className="form-control"
          name="name_original"
          value={form.name_original || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Phiên bản (EN)</label>
        <input
          className="form-control"
          name="version_en"
          value={form.version_en || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Phiên bản gốc</label>
        <input
          className="form-control"
          name="version_original"
          value={form.version_original || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Supertype</label>
        <input
          className="form-control"
          name="supertype"
          value={form.supertype}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Subtypes</label>
        <input
          className="form-control"
          name="subtypes"
          value={form.subtypes || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Độ hiếm</label>
        <input
          className="form-control"
          name="rarity"
          value={form.rarity}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Họa sĩ</label>
        <input
          className="form-control"
          name="illustrator"
          value={form.illustrator || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Flavor Text</label>
        <input
          className="form-control"
          name="flavorText"
          value={form.flavorText || ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Hình tham khảo</label>
        <input
          className="form-control"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {form.reference_image_url && (
          <div className="mt-2">
            <img
              src={form.reference_image_url}
              alt="Card Image"
              style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #eee" }}
            />
          </div>
        )}
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Ngày cập nhật</label>
        <input
          className="form-control"
          type="datetime-local"
          name="updated_at"
          value={form.updated_at ? form.updated_at.substring(0, 16) : ""}
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
      <h3 className="mb-3 fw-bold">Danh sách thẻ Pokemon</h3>
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
      {/* Thêm scroll ngang cho bảng */}
      <div style={{ overflowX: "auto" }}>
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
      </div>
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

export default PokemonCardPage;