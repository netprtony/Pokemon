import React, { useState } from "react";
import { Table, Pagination, Form } from "react-bootstrap";

type Column = {
  key: string;
  label: string;
};

type DataRow = {
  [key: string]: string;
};

interface DataTableProps {
  columns: Column[];
  data: DataRow[];
  pageSizeOptions?: number[];
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, pageSizeOptions = [5, 10, 20] }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // --- SORT ---
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key!];
      const valB = b[sortConfig.key!];
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-3">
      {/* Page Size Selector */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Select
          value={pageSize}
          style={{ width: "100px" }}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Form.Select>
        <span className="fw-bold">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ cursor: "pointer" }}
                onClick={() => handleSort(col.key)}
              >
                {col.label}{" "}
                {sortConfig.key === col.key
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <Pagination className="justify-content-center">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        />
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item
            key={index}
            active={index + 1 === currentPage}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        />
      </Pagination>
    </div>
  );
};

export default DataTable;
