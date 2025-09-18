import React, { useState, useEffect, type ChangeEvent } from "react";
import { toast } from "react-toastify";


// Định nghĩa kiểu cho field option và filter
export interface FieldOption {
  value: string;
  label: string;
  type?: "number" | "date" | "month" | "text" | "boolean";
}

export interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface AdvancedFiltersProps {
  fieldOptions: FieldOption[];
  filters: Filter[];
  onAddFilter?: (filter: Filter) => void;
  onRemoveFilter?: (index: number) => void;
  onSearch?: (term: string) => void;
  onLoad?: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  fieldOptions = [],
  filters = [],
  onAddFilter,
  onRemoveFilter,
  onSearch,
  onExportCSV,
  onExportJSON,
}) => {
  const [newFilter, setNewFilter] = useState<Filter>({
    field: fieldOptions[0]?.value || "",
    operator: ">=",
    value: "",
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (fieldOptions && fieldOptions.length && !newFilter.field) {
      setNewFilter((prev) => ({ ...prev, field: fieldOptions[0].value }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldOptions]);

  const add = () => {
    if (!newFilter.field || newFilter.value === "") {
      toast.warn("Vui lòng chọn trường và nhập giá trị lọc");
      return;
    }
    onAddFilter && onAddFilter({ ...newFilter });
    setNewFilter((prev) => ({ ...prev, value: "" }));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch && onSearch(value);
  };

  const operatorLabel: Record<string, string> = {
    eq: "=",
    ne: "!=",
    gt: ">",
    lt: "<",
    ge: ">=",
    le: "<=",
    like: "~",
  };

  return (
    <div className="mb-4">
      <h5 className="mb-3 badge bg-success ">🔍 Bộ lọc nâng cao</h5>

      {/* Thanh tìm kiếm */}
      <div className="row g-3 mb-3">
        <div className="col-md-12">
          <input
            type="text"
            className="form-control placeholder-glow"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              className="btn btn-sm btn-outline-secondary mt-2"
              type="button"
              onClick={() => {
                setSearchTerm("");
                onSearch && onSearch("");
              }}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="row g-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label badge bg-success">Trường</label>
          <select
            className="form-select placeholder-glow"
            value={newFilter.field}
            onChange={(e) =>
              setNewFilter((prev) => ({ ...prev, field: e.target.value }))
            }
          >
            <option value="">-- Chọn trường --</option>
            {fieldOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label badge bg-success">Toán tử</label>
          <select
            className="form-select placeholder-glow"
            value={newFilter.operator}
            onChange={(e) =>
              setNewFilter((prev) => ({
                ...prev,
                operator: e.target.value,
              }))
            }
          >
            <option value="eq">=</option>
            <option value="ne">!=</option>
            <option value="gt">{">"}</option>
            <option value="lt">{"<"}</option>
            <option value="ge">{">="}</option>
            <option value="le">{"<="}</option>
            <option value="like">Gần bằng</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label badge bg-success">Giá trị</label>
          {(() => {
            const selectedField = fieldOptions.find(
              (opt) => opt.value === newFilter.field
            );
            if (selectedField?.type === "number") {
              return (
                <input
                  type="text"
                  className="form-control placeholder-glow"
                  value={
                    newFilter.value
                      ? Number(newFilter.value).toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[.,\s]/g, "");
                    if (/^\d*$/.test(raw)) {
                      setNewFilter((prev) => ({
                        ...prev,
                        value: raw,
                      }));
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Nhập số..."
                />
              );
            }
            if (
              selectedField?.type === "date" ||
              selectedField?.type === "month"
            ) {
              return (
                <input
                  type="month"
                  className="form-control placeholder-glow"
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  placeholder="Chọn tháng/năm"
                />
              );
            }
            // Mặc định là text
            return (
              <input
                type="text"
                className="form-control placeholder-glow"
                value={newFilter.value}
                onChange={(e) =>
                  setNewFilter((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                placeholder="Nhập giá trị..."
              />
            );
          })()}
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-primary w-100" type="button" onClick={add}>
            ➕ Thêm bộ lọc
          </button>
        </div>
      </div>

      {/* Danh sách bộ lọc */}
      {filters.length > 0 && (
        <div className="mt-4">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h6 className="mb-0">Các bộ lọc đang áp dụng:</h6>
            {filters.map((f, i) => (
              <div
                key={i}
                className="badge bg-info text-dark d-flex align-items-center gap-1 px-2 py-2"
              >
                <span>
                  {fieldOptions.find((opt) => opt.value === f.field)?.label}{" "}
                  {operatorLabel[f.operator] || f.operator} {String(f.value)}
                </span>
                <button
                  className="btn-close btn-close-dark ms-2"
                  type="button"
                  onClick={() => onRemoveFilter && onRemoveFilter(i)}
                  style={{ fontSize: "0.8rem" }}
                ></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Xuất dữ liệu */}
      <div className="mt-4 d-flex gap-2">
        <button className="btn btn-success d-flex align-items-center gap-2" type="button" onClick={onExportCSV}>
          <i className="bi bi-file-earmark-spreadsheet fs-5"></i>
          Export CSV
        </button>
        <button className="btn btn-warning d-flex align-items-center gap-2" type="button" onClick={onExportJSON}>
          <i className="bi bi-file-earmark-code fs-5"></i>
          Export JSON
        </button>
       
      </div>
    </div>
  );
};

export default AdvancedFilters;