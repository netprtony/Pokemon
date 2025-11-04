/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState, useRef, useEffect } from "react";
import { Table, Pagination, Form } from "react-bootstrap";
import ModalIOS from "./Modal";
import "../assets/css/theme.css";
import "../assets/css/Loader.css";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T, idx: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
  onSort?: () => void;
  sortActive?: boolean;
  sortDirection?: "asc" | "desc";
  sticky?: boolean;
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
  onCollapseOpen?: (row: T) => void;
  onCollapseClose?: () => void;
  onRowClick?: (row: T) => void;
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
  onCollapseOpen,
  onCollapseClose,
  onRowClick,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize ?? 10);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);
  const collapseRef = useRef<HTMLDivElement | null>(null);

  const currentPage = page ?? internalPage;
  const currentPageSize = pageSize ?? internalPageSize;

  const total = totalRows ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  const paginatedData =
    page && setPage
      ? data
      : data.slice((currentPage - 1) * currentPageSize, currentPage * currentPageSize);

  // Smooth expand/collapse animation
  useEffect(() => {
    const el = collapseRef.current;
    if (!el) return;

    if (openRow !== null) {
      // Force reflow
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.maxHeight = `${el.scrollHeight}px`;
          el.style.opacity = "1";
        });
      });
      // After animation ends, set to auto for dynamic content
      const timer = setTimeout(() => {
        if (openRow !== null) {
          el.style.maxHeight = "none";
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      if (el.style.maxHeight === "none") {
        el.style.maxHeight = `${el.scrollHeight}px`;
        requestAnimationFrame(() => {
          el.style.maxHeight = "0px";
          el.style.opacity = "0";
        });
      } else {
        el.style.maxHeight = "0px";
        el.style.opacity = "0";
      }
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

  const handleRowClick = (row: T, globalIdx: number) => {
    // Invoke row click handler if provided
    onRowClick && onRowClick(row);

    if (!renderCollapse) return;
    if (openRow === globalIdx) {
      setOpenRow(null);
      onCollapseClose && onCollapseClose();
    } else {
      setOpenRow(globalIdx);
      onCollapseOpen && onCollapseOpen(row);
    }
  };

  // Helper function để lấy giá trị text từ cell
  const getCellValue = (row: T, col: Column<T>): string => {
    const rawValue = (row as any)[col.key];
    if (rawValue === null || rawValue === undefined) return "";
    if (typeof rawValue === "object") return JSON.stringify(rawValue);
    return String(rawValue);
  };

  return (
    <div
      className="rounded-4 p-4 shadow-sm"
      style={{
        fontFamily: "inherit",
        background: "var(--app-bg)",
        color: "var(--sidebar-text)",
        transition: "background 0.2s, color 0.2s",
      }}
    >
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
      <div
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          overflowX: "auto",
          width: "100%",
          maxWidth: "1590px",
          position: "relative",
        }}
      >
        <Table
          hover
          responsive
          className="align-middle mb-0"
          ref={tableRef}
          style={{
            fontSize: "1rem",
            minWidth: 1200,
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead
            style={{
              background: "var(--table-header-bg)",
              position: "sticky",
              top: 0,
              zIndex: 3,
            }}
          >
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
                    position: "sticky",
                    top: 0,
                    zIndex: col.sticky ? 4 : 3,
                    left: col.sticky ? 0 : undefined,
                    boxShadow: col.sticky ? "2px 0 8px -2px rgba(0,0,0,0.04)" : undefined,
                    fontWeight: 700,
                    color: "var(--table-header-text)",
                    background: "var(--table-header-bg)",
                    border: "none",
                    fontSize: "1rem",
                  }}
                  onClick={() => col.onSort && handleSort(col.key)}
                  title={col.label}
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
                <td colSpan={columns.length} className="text-center py-5" style={{
                  background: "var(--table-header-bg)",
                  color: "var(--table-header-text)"
                }}>
                  <div className="d-flex flex-column align-items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="placeholder-glow w-100 mb-3">
                        <span className="placeholder col-12" style={{ height: 110, borderRadius: 8 }}></span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-5" style={{
                  background: "var(--table-header-bg)",
                  color: "var(--table-header-text)"
                }}>
                  <div className="d-flex flex-column align-items-center gap-3">
                    <img
                      src="/images/DataNotAvailable.svg"
                      alt="No data"
                      style={{ width: 220, height: 220, objectFit: "contain", opacity: 0.5 }}
                    />
                  </div>
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
                        background: globalIdx % 2 === 0 ? "var(--sidebar-bg)" : "var(--filter-bg)",
                        color: "var(--sidebar-text)",
                        transition: "background 0.2s, color 0.2s",
                      }}
                      onClick={() => handleRowClick(row, globalIdx)}
                    >
                      {columns.map((col) => {
                        const cellValue = getCellValue(row, col);
                        const isImageColumn = col.key.toLowerCase().includes("img") ||
                                            col.key.toLowerCase().includes("image") ||
                                            col.key.toLowerCase().includes("symbol");
                        
                        return (
                          <td
                            key={col.key}
                            style={{
                              textAlign: col.align || "left",
                              verticalAlign: "middle",
                              border: "none",
                              fontWeight: col.key === "status" ? 600 : 400,
                              fontSize: "1rem",
                              color: "inherit",
                              position: col.sticky ? "sticky" : undefined,
                              left: col.sticky ? 0 : undefined,
                              zIndex: col.sticky ? 1 : undefined,
                              background: col.sticky ? "var(--table-header-bg)" : "inherit",
                            }}
                            title={isImageColumn ? "" : cellValue}
                          >
                            {/* Nếu là hình ảnh, cho phép click để xem lớn */}
                            {isImageColumn ? (
                              (row as Record<string, any>)[col.key] ? (
                                <img
                                  src={(row as Record<string, any>)[col.key]}
                                  alt="preview"
                                  style={{ width: 100, height: 100, objectFit: "contain", cursor: "pointer", borderRadius: 6 }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setPreviewImg((row as Record<string, any>)[col.key]);
                                  }}
                                  title={cellValue}
                                />
                              ) : (
                                <img
                                  src="/images/NoResult.jpg"
                                  alt="No image"
                                  style={{ width: 100, height: 100, objectFit: "contain", opacity: 0.4, borderRadius: 6 }}
                                  title="No image"
                                />
                              )
                            ) : col.render ? (
                              col.render(row, globalIdx)
                            ) : (
                              typeof (row as any)[col.key] === "string" && (row as any)[col.key].length > 20
                                ? ((row as any)[col.key].slice(0, 20) + "...")
                                : (row as any)[col.key]
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {renderCollapse && openRow === globalIdx && (
                      <tr style={{ background: "var(--filter-bg)", color: "var(--filter-text)" }}>
                        <td colSpan={columns.length} style={{ padding: 0, border: "none" }}>
                          <div
                            ref={collapseRef}
                            className="overflow-hidden border-start border-primary ps-3"
                            style={{
                              maxHeight: "0px",
                              opacity: 0,
                              transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
                              background: "var(--filter-bg)",
                              color: "var(--filter-text)",
                            }}
                          >
                            {/* Loader khi loading table con */}
                            {typeof (row as any).loadingDetail !== "undefined" && (row as any).loadingDetail ? (
                              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
                                <span className="loader"></span>
                              </div>
                            ) : (
                              renderCollapse(row)
                            )}
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
          <span
            className="ms-1"
            style={{
              color: "var(--filter-text, #949494)",
              transition: "color 0.2s"
            }}
          >
            of {total} entries
          </span>
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
