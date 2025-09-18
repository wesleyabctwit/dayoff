import React, { useState, useEffect } from "react";
import { RequestItem, PaginationInfo } from "../types";

const RequestApprovalTab: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 分頁和篩選狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // 排序狀態
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // 載入資料
  useEffect(() => {
    fetchRequests();
  }, [
    currentPage,
    selectedYear,
    selectedMonth,
    selectedStatus,
    selectedType,
    sortField,
    sortDirection,
  ]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedType) params.append("type", selectedType);
      if (sortField) {
        params.append("sortField", sortField);
        params.append("sortDirection", sortDirection);
      }

      const res = await fetch(
        `/api/admin-dashboard/requests?${params.toString()}`
      );
      if (!res.ok) throw new Error("載入失敗");
      const data: { requests: RequestItem[]; pagination: PaginationInfo } =
        await res.json();
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
      setPagination(data.pagination || null);
    } catch {
      setRequests([]);
      setPagination(null);
      setError("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  // 處理請假狀態變更
  const handleStatusChange = async (id: number, newStatus: string) => {
    const originalRequests = [...requests];
    const updatedRequests = requests.map((req) =>
      req.id === id ? { ...req, status: newStatus } : req
    );
    setRequests(updatedRequests);

    try {
      const res = await fetch("/api/admin-dashboard/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("更新失敗");
      }

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "更新失敗");
      }

      // 後端更新成功後，重新載入整個清單以取得正確的剩餘天數
      await fetchRequests();
    } catch (error) {
      setRequests(originalRequests);
      const message =
        error instanceof Error ? error.message : "更新時發生伺服器錯誤";
      setError(message);
      alert(`錯誤：${message}`);
    }
  };

  // 處理篩選條件變更
  const handleFilterChange = (type: string, value: string) => {
    setCurrentPage(1); // 重置到第一頁
    if (type === "year") {
      setSelectedYear(value);
    } else if (type === "month") {
      setSelectedMonth(value);
    } else if (type === "status") {
      setSelectedStatus(value);
    } else if (type === "type") {
      setSelectedType(value);
    }
  };

  // 處理分頁變更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 清除篩選條件
  const clearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedStatus("");
    setSelectedType("");
    setCurrentPage(1);
  };

  // 處理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // 重置到第一頁
  };

  // 取得排序圖示
  const getSortIcon = (field: string) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // 格式化日期時間
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        載入中...
      </div>
    );
  }

  return (
    <div id="requests" className="tab-content">
      <div className="card">
        <h3>請假申請管理</h3>
        <p className="hint-text">
          提示：當申請從「已核准」改為「待審核」或「已拒絕」時，系統會自動將先前扣除的天數加回；從非「已核准」改為「已核准」時會扣除天數。
        </p>

        {/* 篩選控制項 */}
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="year-filter">年份：</label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="">全部年份</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="month-filter">月份：</label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => handleFilterChange("month", e.target.value)}
            >
              <option value="">全部月份</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, "0");
                return (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">狀態：</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="approved">已核准</option>
              <option value="rejected">已拒絕</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">假別：</label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="">全部假別</option>
              <option value="特休">特休</option>
              <option value="補休">補休</option>
              <option value="事假">事假</option>
              <option value="病假">病假</option>
              <option value="喪假">喪假</option>
              <option value="育嬰假">育嬰假</option>
              <option value="產假">產假</option>
              <option value="婚假">婚假</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            清除篩選
          </button>
        </div>

        <div id="pending-requests" className="table-container">
          {requests.length === 0 ? (
            <span>尚無符合條件的申請</span>
          ) : (
            <table>
              <thead>
                <tr>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("employee")}
                  >
                    員工 {getSortIcon("employee")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("date")}
                  >
                    請假日期 {getSortIcon("date")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("type")}
                  >
                    假別 {getSortIcon("type")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("days")}
                  >
                    申請天數 {getSortIcon("days")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("remainingDays")}
                  >
                    剩餘天數 {getSortIcon("remainingDays")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("createdAt")}
                  >
                    申請時間 {getSortIcon("createdAt")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("updatedAt")}
                  >
                    審核時間 {getSortIcon("updatedAt")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("status")}
                  >
                    狀態 {getSortIcon("status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: RequestItem, i) => (
                  <tr key={i}>
                    <td>{req.employee}</td>
                    <td>{req.date}</td>
                    <td>{req.type}</td>
                    <td>{req.days}</td>
                    <td>
                      <span
                        className={`remaining-days ${
                          req.remainingDays < req.days
                            ? "insufficient"
                            : "sufficient"
                        }`}
                      >
                        {req.remainingDays}
                      </span>
                    </td>
                    <td>{formatDateTime(req.createdAt)}</td>
                    <td>{formatDateTime(req.updatedAt)}</td>
                    <td>
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleStatusChange(req.id, e.target.value)
                        }
                        className={`status-select status-${req.status}`}
                      >
                        <option value="pending">待審核</option>
                        <option value="approved">已核准</option>
                        <option value="rejected">已拒絕</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分頁控制項 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              顯示第{" "}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{" "}
              筆，共 {pagination.totalItems} 筆
            </div>
            <div className="pagination-buttons">
              <button
                className="btn btn-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                上一頁
              </button>

              <div className="page-numbers">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    className={`btn ${
                      page === pagination.currentPage
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestApprovalTab;
