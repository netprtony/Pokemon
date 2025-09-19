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
  photo_avatar?: string;
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
  photo_avatar: "",
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
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

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setFormTouched(true);
    }
  };

  const handleUploadPhoto = async () => {
    if (!uploadFile || !form.inventory_id) return;
    const fd = new FormData();
    fd.append("file", uploadFile);
    try {
      const resp = await axios.post(`${API_URL}/${form.inventory_id}/upload-photo`, fd);
      toast.success("Upload hình thành công!");
      // Cập nhật lại form.photo_avatar với đường dẫn mới từ API
      setForm((prev) => ({
        ...prev,
        photo_avatar: (resp.data as { photo_avatar: string }).photo_avatar,
      }));
      fetchData();
      setUploadFile(null);
    } catch {
      toast.error("Lỗi khi upload hình!");
    }
  };

  const handlePreviewImage = (url: string) => setPreviewImg(url);
  // const handlePreviewImages = (urls: string[] = []) => setPreviewImgs(urls || []);

  // Table columns
  const columns = [
    {
      key: "photo_avatar",
      label: "",
      render: (row: InventoryRow) =>
        row.photo_avatar ? (
          <img
            src={row.photo_avatar}
            alt={row.master_card_id}
            style={{ width: 36, height: 36, objectFit: "contain", cursor: "pointer" }}
            onClick={() => row.photo_avatar && handlePreviewImage(row.photo_avatar)}
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
    <form className="px-3 pb-3" autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {/* Cột trái */}
      <div>
        <label className="form-label fw-semibold">Mã thẻ</label>
        <input className="form-control" name="master_card_id" value={form.master_card_id} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Tổng số lượng</label>
        <input className="form-control" type="number" name="total_quantity" value={form.total_quantity} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Số lượng đã bán</label>
        <input className="form-control" type="number" name="quantity_sold" value={form.quantity_sold ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Giá mua trung bình</label>
        <input className="form-control" type="number" name="avg_purchase_price" value={form.avg_purchase_price ?? ""} onChange={handleFormChange} required />
      </div>
      <div>
        <label className="form-label fw-semibold">Giá bán trung bình</label>
        <input className="form-control" type="number" name="avg_selling_price" value={form.avg_selling_price ?? ""} onChange={handleFormChange} />
      </div>
      <div>
        <label className="form-label fw-semibold">Vị trí lưu trữ</label>
        <input className="form-control" name="storage_location" value={form.storage_location ?? ""} onChange={handleFormChange} />
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
      {/* Ảnh đại diện */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Ảnh đại diện</label>
        <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} />
        {form.photo_avatar && (
          <div className="mt-2">
            <img
              src={form.photo_avatar}
              alt="Avatar"
              style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", cursor: "pointer" }}
              onClick={() => form.photo_avatar && handlePreviewImage(form.photo_avatar)}
            />
          </div>
        )}
        <button
          type="button"
          className="btn btn-outline-primary mt-2"
          onClick={handleUploadPhoto}
          disabled={!uploadFile}
        >
          Upload ảnh
        </button>
      </div>
      {/* Button thao tác ở góc phải dưới */}
      <div style={{
        gridColumn: "1 / span 2",
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
      }}>
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