import React, { useState, useRef, useEffect } from "react";
import { Table, Pagination, Form } from "react-bootstrap";
import ModalIOS from "./Modal"; // Import your modal component here

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T, idx: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
  onSort?: () => void;
  sortActive?: boolean;
  sortDirection?: "asc" | "desc";
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSizeOptions?: number[];
  totalRows?: number;
  page?: number;
  setPage?: (page: number) => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  loading?: boolean;
  renderCollapse?: (row: T) => React.ReactNode;
  onSort?: (field: string, order: "asc" | "desc") => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export default function DataTable<T>({
  columns,
  data,
  totalRows,
  page,
  setPage,
  pageSize,
  setPageSize,
  loading,
  onSort,
  sortField,
  sortOrder,
  renderCollapse,
}: DataTableProps<T>) {
  // State nội bộ
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize ?? 10); // mặc định 10 nếu không truyền vào
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);
  const collapseRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  const currentPage = page ?? internalPage;
  const currentPageSize = pageSize ?? internalPageSize;

  const total = totalRows ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  const paginatedData =
    page && setPage
      ? data
      : data.slice((currentPage - 1) * currentPageSize, currentPage * currentPageSize);

  // Cập nhật maxHeight khi mở row
  useEffect(() => {
    if (openRow !== null && collapseRef.current) {
      setMaxHeight(collapseRef.current.scrollHeight + "px");
    } else {
      setMaxHeight("0px");
    }
  }, [openRow]);

  const handleSort = (field: string) => {
    if (onSort) {
      let order: "asc" | "desc" = "asc";
      if (sortField === field && sortOrder === "asc") order = "desc";
      onSort(field, order);
    }
  };
  const startResize = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth =
      tableRef.current?.querySelector<HTMLTableCellElement>(
        `th[data-key="${key}"]`
      )?.offsetWidth || 100;

    const doDrag = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths((prev) => ({
        ...prev,
        [key]: newWidth,
      }));
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  return (
    <div className="bg-white rounded-4 p-4 shadow-sm" style={{ fontFamily: "inherit" }}>
      {/* Top controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">Show</span>
          <Form.Control
            type="number"
            size="sm"
            style={{ width: 70, fontWeight: 500 }}
            value={currentPageSize}
            min={1}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              setPageSize
                ? (setPageSize(val), setPage?.(1))
                : (setInternalPageSize(val), setInternalPage(1));
            }}
          />
          <span className="fw-semibold">entries</span>
        </div>
      </div>

      {/* Table with scroll */}
      <div style={{ maxHeight: "70vh", overflowY: "auto", overflowX: "auto", width: "100%", maxWidth: "1630px" }}>
        <Table
          hover
          responsive
          className="align-middle mb-0"
          ref={tableRef}
          style={{ fontSize: "1rem", minWidth: 1200 }}
        >
          <thead style={{ background: "#F7F7FA" }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  data-key={col.key}
                  style={{
                    cursor: col.onSort ? "pointer" : "default",
                    textAlign: col.align || "left",
                    width: colWidths[col.key] || col.width,
                    whiteSpace: "nowrap",
                    position: "relative",
                    fontWeight: 700,
                    color: "#22223B",
                    background: "#F7F7FA",
                    border: "none",
                    fontSize: "1rem",
                  }}
                  onClick={() => col.onSort && handleSort(col.key)}
                >
                  {col.label}
                  {col.onSort && (
                    <span className="ms-1" style={{ fontSize: 12 }}>
                      {col.sortActive
                        ? col.sortDirection === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </span>
                  )}
                  {/* Handle resize */}
                  <div
                    onMouseDown={(e) => startResize(e, col.key)}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 5,
                      height: "100%",
                      cursor: "col-resize",
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="placeholder-glow w-100 mb-3">
                      <span className="placeholder col-12" style={{ height: 32, borderRadius: 8 }}></span>
                    </div>
                    <div className="placeholder-glow w-100 mb-3">
                      <span className="placeholder col-12" style={{ height: 32, borderRadius: 8 }}></span>
                    </div>
                    <div className="placeholder-glow w-100 mb-3">
                      <span className="placeholder col-12" style={{ height: 32, borderRadius: 8 }}></span>
                    </div>
                    <span className="text-muted mt-3">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-5">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const globalIdx = (currentPage - 1) * currentPageSize + idx;
                return (
                  <React.Fragment key={globalIdx}>
                    <tr
                      style={{
                        cursor: renderCollapse ? "pointer" : "default",
                        background: globalIdx % 2 === 0 ? "#fff" : "#F7F7FA",
                      }}
                      onClick={() => renderCollapse && setOpenRow(openRow === globalIdx ? null : globalIdx)}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align || "left",
                            verticalAlign: "middle",
                            border: "none",
                            fontWeight: col.key === "status" ? 600 : 400,
                            fontSize: "1rem",
                          }}
                        >
                          {/* Nếu là hình ảnh, cho phép click để xem lớn */}
                          {col.key.toLowerCase().includes("img") || col.key.toLowerCase().includes("image") || col.key.toLowerCase().includes("symbol") ? (
                            (row as Record<string, any>)[col.key]? (
                              <img
                                src={(row as Record<string, any>)[col.key]}
                                alt="preview"
                                style={{ width: 100, height: 100, objectFit: "contain", cursor: "pointer", borderRadius: 6 }}
                                onClick={e => {
                                  e.stopPropagation();
                                  setPreviewImg((row as Record<string, any>)[col.key]);
                                }}
                              />
                            ) : (
                              <i className="bi bi-image text-secondary fs-3" title="No image" />
                            )
                          ) : col.render ? col.render(row, globalIdx) : (
                            typeof (row as any)[col.key] === "string" && (row as any)[col.key].length > 20
                              ? ((row as any)[col.key].slice(0, 20) + "...")
                              : (row as any)[col.key]
                          )}
                        </td>
                      ))}
                    </tr>
                    {renderCollapse && openRow === globalIdx && (
                      <tr style={{ background: "#F7F7FA" }}>
                        <td colSpan={columns.length}>
                          <div
                            ref={collapseRef}
                            className="overflow-hidden border-start border-primary ps-3"
                            style={{
                              maxHeight,
                              transition: "max-height 0.3s ease",
                            }}
                          >
                            {renderCollapse(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
      {/* Modal xem hình lớn */}
      <ModalIOS
        isOpen={!!previewImg}
        onClose={() => setPreviewImg(null)}
        title="Xem hình"
        message=""
        confirmText=""
        cancelText="Đóng"
        onConfirm={() => setPreviewImg(null)}
      >
        {previewImg && (
          <div className="d-flex justify-content-center align-items-center py-3">
            <img
              src={previewImg}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
            />
          </div>
        )}
      </ModalIOS>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
        <div>
          <span className="fw-bold text-primary">
            {total === 0
              ? "0"
              : `${(currentPage - 1) * currentPageSize + 1} - ${Math.min(
                  currentPage * currentPageSize,
                  total
                )}`}
          </span>
          <span className="text-muted ms-1">of {total} entries</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Pagination className="mb-0">
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() =>
                setPage
                  ? setPage(Math.max(1, currentPage - 1))
                  : setInternalPage(Math.max(1, currentPage - 1))
              }
            />
          </Pagination>
          <Form.Control
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            style={{ width: 70, fontWeight: 600, borderRadius: 8 }}
            onChange={e => {
              let val = Number(e.target.value);
              if (isNaN(val) || val < 1) val = 1;
              if (val > totalPages) val = totalPages;
              setPage ? setPage(val) : setInternalPage(val);
            }}
            onBlur={e => {
              let val = Number(e.target.value);
              if (isNaN(val) || val < 1) val = 1;
              if (val > totalPages) val = totalPages;
              setPage ? setPage(val) : setInternalPage(val);
            }}
          />
          <span className="fw-semibold ms-1">/ {totalPages}</span>
          <Pagination className="mb-0">
            <Pagination.Next
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setPage
                  ? setPage(Math.min(totalPages, currentPage + 1))
                  : setInternalPage(Math.min(totalPages, currentPage + 1))
              }
            />
          </Pagination>
        </div>
      </div>
    </div>
  );
}
