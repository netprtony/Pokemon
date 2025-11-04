import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../../components/Table";
import AdvancedFilters from "../../components/AdvancedFilters";
import Modal from "../../components/Modal";
import ModalConfirm from "../../components/ModalConfirm";
import { toast } from "react-toastify";
import type { Filter } from "../../components/AdvancedFilters";
import type { FieldOption } from "../../components/AdvancedFilters";

// Kiểu dữ liệu cho 1 dòng MarketPrice
export type MarketPriceRow = {
  price_id: number;
  master_card_id: string;
  tcgplayer_nm_price?: number;
  tcgplayer_lp_price?: number;
  ebay_avg_price?: number;
  pricecharting_price?: number;
  cardrush_a_price?: number;
  cardrush_b_price?: number;
  snkrdunk_price?: number;
  yahoo_auction_avg?: number;
  usd_to_vnd_rate?: number;
  jpy_to_vnd_rate?: number;
  price_date: string;
  data_source?: string;
};

const fieldOptions: FieldOption[] = [
  { value: "price_id", label: "ID", type: "number" },
  { value: "master_card_id", label: "Mã thẻ", type: "text" },
  { value: "tcgplayer_nm_price", label: "TCG NM", type: "money" },
  { value: "tcgplayer_lp_price", label: "TCG LP", type: "money" },
  { value: "ebay_avg_price", label: "eBay Avg", type: "money" },
  { value: "pricecharting_price", label: "PriceCharting", type: "money" },
  { value: "cardrush_a_price", label: "CardRush A", type: "money" },
  { value: "cardrush_b_price", label: "CardRush B", type: "money" },
  { value: "snkrdunk_price", label: "Snkrdunk", type: "money" },
  { value: "yahoo_auction_avg", label: "Yahoo Auction", type: "money" },
  { value: "usd_to_vnd_rate", label: "USD/VND", type: "money" },
  { value: "jpy_to_vnd_rate", label: "JPY/VND", type: "money" },
  { value: "price_date", label: "Ngày giá", type: "date" },
  { value: "data_source", label: "Nguồn", type: "text" },
];

const API_URL = "http://localhost:8000/market-price";

type ModalMode = "add" | "edit" | null;

const defaultForm: MarketPriceRow = {
  price_id: 0,
  master_card_id: "",
  tcgplayer_nm_price: undefined,
  tcgplayer_lp_price: undefined,
  ebay_avg_price: undefined,
  pricecharting_price: undefined,
  cardrush_a_price: undefined,
  cardrush_b_price: undefined,
  snkrdunk_price: undefined,
  yahoo_auction_avg: undefined,
  usd_to_vnd_rate: undefined,
  jpy_to_vnd_rate: undefined,
  price_date: "",
  data_source: "",
};

const MarketPricePage: React.FC = () => {
  const [data, setData] = useState<MarketPriceRow[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<MarketPriceRow>(defaultForm);
  const [formTouched, setFormTouched] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  const [sortField, setSortField] = useState("price_id");
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
        const data = resp.data as { items: MarketPriceRow[]; total: number };
        setData(data.items);
        setTotal(data.total);
      } else {
        const resp = await axios.get<{ items: MarketPriceRow[]; total: number }>(API_URL, {
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
  };

  // Sửa
  const handleEdit = (row: MarketPriceRow) => {
    setForm({ ...row });
    setModalMode("edit");
    setModalOpen(true);
    setFormTouched(false);
  };

  // Xóa
  const handleDelete = (row: MarketPriceRow) => {
    setConfirmMessage(`Bạn có chắc muốn xóa giá thị trường "${row.price_id}"?`);
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${API_URL}/${row.price_id}`);
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
        await axios.put(`${API_URL}/${form.price_id}`, form);
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
    { key: "price_id", label: "ID", onSort: () => {}, sortActive: sortField === "price_id", sortDirection: sortOrder },
    { key: "master_card_id", label: "Mã thẻ", onSort: () => {}, sortActive: sortField === "master_card_id", sortDirection: sortOrder },
    { key: "tcgplayer_nm_price", label: "TCG NM", onSort: () => {}, sortActive: sortField === "tcgplayer_nm_price", sortDirection: sortOrder },
    { key: "tcgplayer_lp_price", label: "TCG LP", onSort: () => {}, sortActive: sortField === "tcgplayer_lp_price", sortDirection: sortOrder },
    { key: "ebay_avg_price", label: "eBay Avg", onSort: () => {}, sortActive: sortField === "ebay_avg_price", sortDirection: sortOrder },
    { key: "pricecharting_price", label: "PriceCharting", onSort: () => {}, sortActive: sortField === "pricecharting_price", sortDirection: sortOrder },
    { key: "cardrush_a_price", label: "CardRush A", onSort: () => {}, sortActive: sortField === "cardrush_a_price", sortDirection: sortOrder },
    { key: "cardrush_b_price", label: "CardRush B", onSort: () => {}, sortActive: sortField === "cardrush_b_price", sortDirection: sortOrder },
    { key: "snkrdunk_price", label: "Snkrdunk", onSort: () => {}, sortActive: sortField === "snkrdunk_price", sortDirection: sortOrder },
    { key: "yahoo_auction_avg", label: "Yahoo Auction", onSort: () => {}, sortActive: sortField === "yahoo_auction_avg", sortDirection: sortOrder },
    { key: "usd_to_vnd_rate", label: "USD/VND", onSort: () => {}, sortActive: sortField === "usd_to_vnd_rate", sortDirection: sortOrder },
    { key: "jpy_to_vnd_rate", label: "JPY/VND", onSort: () => {}, sortActive: sortField === "jpy_to_vnd_rate", sortDirection: sortOrder },
    { key: "price_date", label: "Ngày giá", onSort: () => {}, sortActive: sortField === "price_date", sortDirection: sortOrder },
    { key: "data_source", label: "Nguồn", onSort: () => {}, sortActive: sortField === "data_source", sortDirection: sortOrder },
    {
      key: "action",
      label: "Thao tác",
      align: "center" as const,
      width: 110,
      render: (row: MarketPriceRow) => (
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
        <label className="form-label fw-semibold">TCG NM</label>
        <input
          className="form-control"
          type="number"
          name="tcgplayer_nm_price"
          value={form.tcgplayer_nm_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">TCG LP</label>
        <input
          className="form-control"
          type="number"
          name="tcgplayer_lp_price"
          value={form.tcgplayer_lp_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">eBay Avg</label>
        <input
          className="form-control"
          type="number"
          name="ebay_avg_price"
          value={form.ebay_avg_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">PriceCharting</label>
        <input
          className="form-control"
          type="number"
          name="pricecharting_price"
          value={form.pricecharting_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">CardRush A</label>
        <input
          className="form-control"
          type="number"
          name="cardrush_a_price"
          value={form.cardrush_a_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">CardRush B</label>
        <input
          className="form-control"
          type="number"
          name="cardrush_b_price"
          value={form.cardrush_b_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Snkrdunk</label>
        <input
          className="form-control"
          type="number"
          name="snkrdunk_price"
          value={form.snkrdunk_price ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Yahoo Auction</label>
        <input
          className="form-control"
          type="number"
          name="yahoo_auction_avg"
          value={form.yahoo_auction_avg ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">USD/VND</label>
        <input
          className="form-control"
          type="number"
          name="usd_to_vnd_rate"
          value={form.usd_to_vnd_rate ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">JPY/VND</label>
        <input
          className="form-control"
          type="number"
          name="jpy_to_vnd_rate"
          value={form.jpy_to_vnd_rate ?? ""}
          onChange={handleFormChange}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Ngày giá</label>
        <input
          className="form-control"
          type="date"
          name="price_date"
          value={form.price_date}
          onChange={handleFormChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Nguồn</label>
        <input
          className="form-control"
          name="data_source"
          value={form.data_source || ""}
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
      <h3 className="mb-3 fw-bold">Danh sách giá thị trường</h3>
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
          <i className="bi bi-plus-lg me-2"></i> Thêm giá thị trường mới
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
        title={modalMode === "add" ? "Thêm giá thị trường mới" : "Chỉnh sửa giá thị trường"}
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

export default MarketPricePage;