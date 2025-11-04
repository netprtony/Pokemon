import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng PokemonSet
export type PokemonSetRow = {
  set_id: string;
  set_name_en: string;
  set_name_original?: string;
  series?: string;
  release_date?: string; // ISO date string
  printed_total?: number;
  total?: number;
  ptcgo_code?: string;
  image_symbol?: string;
  updated_at?: string;
};

// Field options cho filter
const fieldOptions: FieldOption[] = [
  { value: "set_id", label: "Set ID", type: "text" },
  { value: "set_name_en", label: "Tên bộ (EN)", type: "text" },
  { value: "set_name_original", label: "Tên gốc", type: "text" },
  { value: "series", label: "Series", type: "text" },
  { value: "release_date", label: "Ngày phát hành", type: "date" },
  { value: "printed_total", label: "Tổng số thẻ in", type: "number" },
  { value: "total", label: "Tổng số thẻ", type: "number" },
  { value: "ptcgo_code", label: "PTCGO Code", type: "text" },
];

const API_URL = "http://localhost:8000/pokemon-sets";

type ModalMode = "add" | "edit" | null;

const defaultForm: PokemonSetRow = {
  set_id: "",
  set_name_en: "",
  set_name_original: "",
  series: "",
  release_date: "",
  printed_total: undefined,
  total: undefined,
  ptcgo_code: "",
  image_symbol: "",
  updated_at: "",
};

const PokemonSetPage: React.FC = () => {
  const [data, setData] = useState<PokemonSetRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<PokemonSetRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  // Xử lý upload ảnh
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [sortField, setSortField] = useState("set_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch data
  const fetchData = async (field = sortField, order = sortOrder) => {
    setLoading(true);
    try {
      if (filters.length > 0) {
        const resp = await axios.post(
          `${API_URL}/filter`,
          { filters }, // filters là mảng filter đúng format
          { params: { page, page_size: pageSize, sort_field: field, sort_order: order } }
        );
        const data = resp.data as { items: PokemonSetRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: PokemonSetRow[]; total: number }>(API_URL, {
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
    setUploadFile(null);
  };

  // Sửa
  const handleEdit = (row: PokemonSetRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
    setUploadFile(null);
  };

  // Xóa
  const handleDelete = (row: PokemonSetRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa bộ bài "${row.set_name_en}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.set_id}`);
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
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const payload = { ...form, updated_at: now };
      if (modalMode === "add") {
        await axios.post(API_URL, payload);
        toast.success("Thêm mới thành công!");
      } else if (modalMode === "edit") {
        await axios.put(`${API_URL}/${form.set_id}`, payload);
        toast.success("Cập nhật thành công!");
      }
      // Nếu có upload ảnh
      if (uploadFile && form.set_id) {
        const fd = new FormData();
        fd.append("file", uploadFile);
        await axios.post(`${API_URL}/${form.set_id}/upload-symbol`, fd);
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
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
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
      key: "image_symbol",
      label: "",
      render: (row: PokemonSetRow) =>
        row.image_symbol ? (
          <img
            src={row.image_symbol}
            alt={row.set_name_en}
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        ) : (
          <i className="bi bi-image text-secondary fs-3" title="No image" />
        ),
      width: 50,
      align: "center" as const,
      onSort: () => {},
      sortActive: sortField === "image_symbol",
      sortDirection: sortOrder,
    },
    {
      key: "set_id",
      label: "Set ID",
      render: (row: PokemonSetRow) => (
        <span className="fw-bold text-primary">{row.set_id}</span>
      ),
      onSort: () => {},
      sortActive: sortField === "set_id",
      sortDirection: sortOrder,
    },
    { key: "set_name_en", label: "Tên bộ (EN)", onSort: () => {}, sortActive: sortField === "set_name_en", sortDirection: sortOrder },
    { key: "set_name_original", label: "Tên gốc", onSort: () => {}, sortActive: sortField === "set_name_original", sortDirection: sortOrder },
    { key: "series", label: "Series", onSort: () => {}, sortActive: sortField === "series", sortDirection: sortOrder },
    {
      key: "release_date",
      label: "Ngày phát hành",
      render: (row: PokemonSetRow) =>
        row.release_date
          ? new Date(row.release_date).toLocaleDateString("vi-VN")
          : "-",
      onSort: () => {},
      sortActive: sortField === "release_date",
      sortDirection: sortOrder,
    },
    { key: "printed_total", label: "Tổng số thẻ in", onSort: () => {}, sortActive: sortField === "printed_total", sortDirection: sortOrder },
    { key: "total", label: "Tổng số thẻ", onSort: () => {}, sortActive: sortField === "total", sortDirection: sortOrder },
    { key: "ptcgo_code", label: "PTCGO Code", onSort: () => {}, sortActive: sortField === "ptcgo_code", sortDirection: sortOrder },
    {
      key: "updated_at",
      label: "Ngày cập nhật",
      render: (row: PokemonSetRow) =>
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
      render: (row: PokemonSetRow) => (
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
      className="pokemonset-modal-form"
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
      {/* Cột 1: Ảnh biểu tượng bộ bài */}
      <div style={{ gridColumn: "1/2", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <label className="mac-input-label" style={{ alignSelf: "flex-end" }}>Biểu tượng bộ bài</label>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <input
            className="form-control"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {form.image_symbol && (
            <div className="mt-2">
              <img
                src={form.image_symbol}
                alt="Set Symbol"
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "contain",
                  borderRadius: 12,
                  border: "1px solid #eee",
                  marginBottom: 12,
                  cursor: "zoom-in",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Cột 2: Các trường thông tin chính */}
      <div style={{ gridColumn: "2/3", display: "flex", flexDirection: "column", gap: 18 }}>
        <label className="form-label fw-semibold">Set ID</label>
        <input
          className="form-control"
          name="set_id"
          value={form.set_id}
          onChange={handleFormChange}
          disabled={modalMode === "edit"}
          required
        />
        <label className="form-label fw-semibold">Tên bộ (EN)</label>
        <input
          className="form-control"
          name="set_name_en"
          value={form.set_name_en}
          onChange={handleFormChange}
          required
        />
        <label className="form-label fw-semibold">Tên gốc</label>
        <input
          className="form-control"
          name="set_name_original"
          value={form.set_name_original || ""}
          onChange={handleFormChange}
        />
        <label className="form-label fw-semibold">Series</label>
        <input
          className="form-control"
          name="series"
          value={form.series || ""}
          onChange={handleFormChange}
        />
        
      </div>

      {/* Cột 3: Ngày, số lượng */}
      <div style={{ gridColumn: "3/4", display: "flex", flexDirection: "column", gap: 18 }}>
        <label className="form-label fw-semibold">Ngày phát hành</label>
        <input
          className="form-control"
          type="date"
          name="release_date"
          value={form.release_date || ""}
          onChange={handleFormChange}
        />
        <label className="form-label fw-semibold">Tổng số thẻ in</label>
        <input
          className="form-control"
          type="number"
          name="printed_total"
          value={form.printed_total ?? ""}
          onChange={handleFormChange}
        />
        <label className="form-label fw-semibold">Tổng số thẻ</label>
        <input
          className="form-control"
          type="number"
          name="total"
          value={form.total ?? ""}
          onChange={handleFormChange}
        />
        <label className="form-label fw-semibold">PTCGO Code</label>
        <input
          className="form-control"
          name="ptcgo_code"
          value={form.ptcgo_code || ""}
          onChange={handleFormChange}
        />
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
      <h3 className="mb-3 fw-bold">Danh sách bộ bài Pokemon</h3>
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
          <i className="bi bi-plus-lg me-2"></i> Thêm bộ bài mới
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
        title={modalMode === "add" ? "Thêm bộ bài mới" : "Chỉnh sửa bộ bài"}
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

export default PokemonSetPage;
