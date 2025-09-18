import React, { useState, useEffect, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import Button from "./Button";
import Option from "./Option";
import Input from "./Input"; // Thêm import Input
import type { OptionItem } from "./Option";

// Định nghĩa kiểu cho field option và filter
export interface FieldOption {
  value: string;
  label: string;
  type?: "number" | "date" | "month" | "text" | "boolean" | "money";
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

  // Dropdown state cho combobox
  const [fieldDropdown, setFieldDropdown] = useState(false);
  const [operatorDropdown, setOperatorDropdown] = useState(false);

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

  // Tạo danh sách OptionItem cho trường
  const fieldOptionItems: OptionItem[] = fieldOptions.map((opt) => ({
    label: opt.label,
    onClick: () => {
      setNewFilter((prev) => ({ ...prev, field: opt.value }));
      setFieldDropdown(false);
    },
    disabled: false,
  }));

  // Tạo danh sách OptionItem cho toán tử
  const operatorItems: OptionItem[] = [
    { label: "=", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "eq" })); setOperatorDropdown(false); } },
    { label: "!=", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "ne" })); setOperatorDropdown(false); } },
    { label: ">", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "gt" })); setOperatorDropdown(false); } },
    { label: "<", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "lt" })); setOperatorDropdown(false); } },
    { label: ">=", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "ge" })); setOperatorDropdown(false); } },
    { label: "<=", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "le" })); setOperatorDropdown(false); } },
    { label: "Gần bằng", onClick: () => { setNewFilter((prev) => ({ ...prev, operator: "like" })); setOperatorDropdown(false); } },
  ];

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
            <Button
              variant="gray-outline"
              size="md"
              className="mt-2"
              type="button"
              onClick={() => {
                setSearchTerm("");
                onSearch && onSearch("");
              }}
            >
              Xóa tìm kiếm
            </Button>
          )}
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="row g-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label badge bg-success">Trường</label>
          <div style={{ position: "relative" }}>
            <Button
              variant="white-outline"
              size="md"
              className="w-100"
              type="button"
              onClick={() => setFieldDropdown((v) => !v)}
              style={{ textAlign: "left", justifyContent: "flex-start" }}
            >
              {fieldOptions.find(f => f.value === newFilter.field)?.label || "--"}
              <span style={{ float: "right", marginLeft: "auto" }}>▼</span>
            </Button>
            {fieldDropdown && (
              <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 20, width: "100%" }}>
                <Option items={fieldOptionItems} />
              </div>
            )}
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label badge bg-success">Toán tử</label>
          <div style={{ position: "relative" }}>
            <Button
              variant="white-outline"
              size="md"
              className="w-100"
              type="button"
              onClick={() => setOperatorDropdown((v) => !v)}
              style={{ textAlign: "left", justifyContent: "flex-start" }}
            >
              {operatorLabel[newFilter.operator] || newFilter.operator}
              <span style={{ float: "right", marginLeft: "auto" }}>▼</span>
            </Button>
            {operatorDropdown && (
              <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 20, width: "100%" }}>
                <Option items={operatorItems} />
              </div>
            )}
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label badge bg-success">Giá trị</label>
          {(() => {
            const selectedField = fieldOptions.find(
              (opt) => opt.value === newFilter.field
            );
            if (selectedField?.type === "number") {
              return (
                <Input
                  type="number"
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  min={0}
                  label={undefined}
                  placeholder="Nhập số..."
                />
              );
            }
            if (selectedField?.type === "money") {
              return (
                <Input
                  type="money"
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  label={undefined}
                  placeholder="Nhập số tiền..."
                />
              );
            }
            if (selectedField?.type === "date") {
              return (
                <Input
                  type="datetime"
                  value={newFilter.value}
                  onChange={(e) =>
                    setNewFilter((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  label={undefined}
                  placeholder="Chọn ngày giờ"
                />
              );
            }
            // Mặc định là text
            return (
              <Input
                type="text"
                value={newFilter.value}
                onChange={(e) =>
                  setNewFilter((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                label={undefined}
                placeholder="Nhập giá trị..."
              />
            );
          })()}
        </div>

        <div className="col-md-3 d-flex align-items-end">
          <Button variant="primary" size="md" className="w-100" type="button" onClick={add}>
            ➕ Thêm bộ lọc
          </Button>
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
                <Button
                  variant="gray-outline"
                  size="md"
                  className="btn-close btn-close-dark ms-2"
                  type="button"
                  style={{ fontSize: "0.8rem", padding: 0, width: 22, height: 22, minWidth: 22 }}
                  onClick={() => onRemoveFilter && onRemoveFilter(i)}
                  aria-label="Xóa"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Xuất dữ liệu */}
      <div className="mt-4 d-flex gap-2">
        <Button variant="primary-soft" size="md" type="button" onClick={onExportCSV}>
          <i className="bi bi-file-earmark-spreadsheet fs-5"></i>
          Export CSV
        </Button>
        <Button variant="primary-outline-soft" size="md" type="button" onClick={onExportJSON}>
          <i className="bi bi-file-earmark-code fs-5"></i>
          Export JSON
        </Button>
      </div>
    </div>
  );
};

export default AdvancedFilters;