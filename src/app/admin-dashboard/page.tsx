"use client";

import React, { useState, useEffect } from "react";

type OverviewStats = {
  totalEmployees: number;
  pendingRequests: number;
  leavesThisMonth: number;
  annualLeaveUsage: string;
};

type OverviewActivity = {
  time: string;
  employee: string;
  action: string;
  status: "pending" | "approved" | "rejected" | string;
};

type OverviewResponse = {
  stats: OverviewStats;
  activities: OverviewActivity[];
};

type EmployeeItem = {
  name: string;
  email: string;
  password: string; // 新增密碼欄位
  hireDate: string;
  department: string;
  annualLeave: number;
  compensatoryLeave: number;
  notes: string;
};

type RequestItem = {
  employee: string;
  date: string;
  type: string;
  days: number;
  status: "pending" | "approved" | "rejected" | string;
  id: number;
  createdAt?: string;
  updatedAt?: string;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  // 狀態
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("管理員");

  // 分頁和篩選狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // 排序狀態
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 載入使用者資訊
  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  // 登出功能
  const handleLogout = () => {
    // 清除本地儲存的登入資訊
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    // 重導向到首頁
    window.location.href = "/";
  };

  // 依分頁載入資料
  useEffect(() => {
    setError("");
    setLoading(true);
    if (tab === "overview") {
      fetch("/api/admin-dashboard/overview")
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then((data: unknown) => {
          const ok =
            typeof data === "object" && data !== null && "stats" in data;
          if (!ok) throw new Error("資料格式錯誤");
          setOverview(data as OverviewResponse);
        })
        .catch(() => {
          setOverview(null);
          setError("載入失敗");
        })
        .finally(() => setLoading(false));
    } else if (tab === "employees") {
      const params = new URLSearchParams();
      if (sortField) {
        params.append("sortField", sortField);
        params.append("sortDirection", sortDirection);
      }

      fetch(`/api/admin-dashboard/employees?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then((data: EmployeeItem[]) =>
          setEmployees(Array.isArray(data) ? data : [])
        )
        .catch(() => {
          setEmployees([]);
          setError("載入失敗");
        })
        .finally(() => setLoading(false));
    } else if (tab === "requests") {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedStatus) params.append("status", selectedStatus);
      if (sortField) {
        params.append("sortField", sortField);
        params.append("sortDirection", sortDirection);
      }

      fetch(`/api/admin-dashboard/requests?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then(
          (data: { requests: RequestItem[]; pagination: PaginationInfo }) => {
            setRequests(Array.isArray(data?.requests) ? data.requests : []);
            setPagination(data.pagination || null);
          }
        )
        .catch(() => {
          setRequests([]);
          setPagination(null);
          setError("載入失敗");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [
    tab,
    currentPage,
    selectedYear,
    selectedMonth,
    selectedStatus,
    sortField,
    sortDirection,
  ]);

  // 處理新增員工表單提交
  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string, // 新增密碼欄位
      hireDate: formData.get("hireDate") as string,
      department: formData.get("department") as string,
      annualLeave: Number(formData.get("annualLeave")),
      compensatoryLeave: Number(formData.get("compensatoryLeave")),
      notes: (formData.get("notes") as string) || "",
    };

    try {
      const res = await fetch("/api/admin-dashboard/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        alert("員工新增成功！");
        form.reset();
        // 如果目前在員工管理分頁，重新載入資料
        if (tab === "employees") {
          setTab("overview"); // 先切換
          setTimeout(() => setTab("employees"), 100); // 再切回來觸發重新載入
        }
      } else {
        setError(result.message || "新增失敗");
      }
    } catch {
      setError("伺服器錯誤");
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
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // 處理編輯員工
  const handleEditEmployee = (employee: EmployeeItem) => {
    // 設定編輯模式並填入員工資料
    setTab("add-employee");
    // 這裡可以設定表單的預設值
    setTimeout(() => {
      const form = document.querySelector(
        "#add-employee form"
      ) as HTMLFormElement;
      if (form) {
        (form.querySelector('[name="name"]') as HTMLInputElement).value =
          employee.name;
        (form.querySelector('[name="email"]') as HTMLInputElement).value =
          employee.email;
        (form.querySelector('[name="password"]') as HTMLInputElement).value =
          employee.password;
        (form.querySelector('[name="hireDate"]') as HTMLInputElement).value =
          employee.hireDate;
        (form.querySelector('[name="department"]') as HTMLSelectElement).value =
          employee.department;
        (form.querySelector('[name="annualLeave"]') as HTMLInputElement).value =
          employee.annualLeave.toString();
        (
          form.querySelector('[name="compensatoryLeave"]') as HTMLInputElement
        ).value = employee.compensatoryLeave.toString();
        (form.querySelector('[name="notes"]') as HTMLTextAreaElement).value =
          employee.notes;
      }
    }, 100);
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

  return (
    <div className="container">
      <div className="dashboard">
        <div className="header">
          <h1>管理員儀表板</h1>
          <div className="user-info">
            <span>
              歡迎，<span id="user-name">{userName}</span>
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              登出
            </button>
          </div>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab${tab === "overview" ? " active" : ""}`}
            onClick={() => setTab("overview")}
          >
            總覽
          </button>
          <button
            className={`nav-tab${tab === "employees" ? " active" : ""}`}
            onClick={() => setTab("employees")}
          >
            員工管理
          </button>
          <button
            className={`nav-tab${tab === "requests" ? " active" : ""}`}
            onClick={() => setTab("requests")}
          >
            請假審核
          </button>
        </div>
        <div className="content">
          {error && (
            <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
          )}
          {loading && <div>載入中...</div>}
          {/* 總覽頁面 */}
          {tab === "overview" && !!overview?.stats && !loading && (
            <div id="overview" className="tab-content">
              <div className="card">
                <h3>系統統計</h3>
                <div className="leave-balance">
                  <div className="balance-item">
                    <h4>總員工數</h4>
                    <div className="amount">
                      {overview.stats.totalEmployees}
                    </div>
                    <div>人</div>
                  </div>
                  <div className="balance-item">
                    <h4>待審核申請</h4>
                    <div className="amount">
                      {overview.stats.pendingRequests}
                    </div>
                    <div>件</div>
                  </div>
                  <div className="balance-item">
                    <h4>本月請假</h4>
                    <div className="amount">
                      {overview.stats.leavesThisMonth}
                    </div>
                    <div>次</div>
                  </div>
                  <div className="balance-item">
                    <h4>特休使用率</h4>
                    <div className="amount">
                      {overview.stats.annualLeaveUsage}
                    </div>
                    <div>平均</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>最近活動</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>時間</th>
                        <th>員工</th>
                        <th>活動</th>
                        <th>狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.activities.map(
                        (a: OverviewActivity, i: number) => (
                          <tr key={i}>
                            <td>{a.time}</td>
                            <td>{a.employee}</td>
                            <td>{a.action}</td>
                            <td>
                              <span className={`status ${a.status}`}>
                                {a.status === "pending"
                                  ? "待審核"
                                  : a.status === "approved"
                                  ? "已核准"
                                  : a.status}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* 員工管理頁面 */}
          {tab === "employees" && !loading && (
            <div id="employees" className="tab-content">
              <div className="card">
                <div className="card-header">
                  <h3>員工列表</h3>
                  <button
                    className="btn btn-success"
                    onClick={() => setTab("add-employee")}
                  >
                    新增員工
                  </button>
                </div>
                <div id="employee-list" className="table-container">
                  {employees.length === 0 ? (
                    <span>尚無員工資料</span>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("name")}
                          >
                            姓名 {getSortIcon("name")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("email")}
                          >
                            Email {getSortIcon("email")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("hireDate")}
                          >
                            到職日 {getSortIcon("hireDate")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("department")}
                          >
                            部門 {getSortIcon("department")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("annualLeave")}
                          >
                            特休天數 {getSortIcon("annualLeave")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("compensatoryLeave")}
                          >
                            補休天數 {getSortIcon("compensatoryLeave")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("notes")}
                          >
                            備註 {getSortIcon("notes")}
                          </th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp: EmployeeItem, i) => (
                          <tr key={i}>
                            <td>{emp.name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.hireDate}</td>
                            <td>{emp.department}</td>
                            <td>{emp.annualLeave}</td>
                            <td>{emp.compensatoryLeave}</td>
                            <td>{emp.notes}</td>
                            <td>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditEmployee(emp)}
                              >
                                編輯
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* 請假審核頁面 */}
          {tab === "requests" && !loading && (
            <div id="requests" className="tab-content">
              <div className="card">
                <h3>請假申請管理</h3>

                {/* 篩選控制項 */}
                <div className="filter-controls">
                  <div className="filter-group">
                    <label htmlFor="year-filter">年份：</label>
                    <select
                      id="year-filter"
                      value={selectedYear}
                      onChange={(e) =>
                        handleFilterChange("year", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleFilterChange("month", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <option value="">全部狀態</option>
                      <option value="pending">待審核</option>
                      <option value="approved">已核准</option>
                      <option value="rejected">已拒絕</option>
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
                            日期 {getSortIcon("date")}
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
                            天數 {getSortIcon("days")}
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
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        1}{" "}
                      -{" "}
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
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
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
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                      >
                        下一頁
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* 新增員工頁面 */}
          {tab === "add-employee" && (
            <div id="add-employee" className="tab-content">
              <div className="card">
                <h3>新增員工</h3>
                <form onSubmit={addEmployee}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-name">姓名</label>
                      <input
                        type="text"
                        id="new-employee-name"
                        name="name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-email">Email</label>
                      <input
                        type="email"
                        id="new-employee-email"
                        name="email"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-password">密碼</label>
                      <input
                        type="password"
                        id="new-employee-password"
                        name="password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-hire-date">到職日</label>
                      <input
                        type="date"
                        id="new-employee-hire-date"
                        name="hireDate"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-department">部門</label>
                      <select
                        id="new-employee-department"
                        name="department"
                        required
                      >
                        <option value="">請選擇部門</option>
                        <option value="技術部">技術部</option>
                        <option value="行銷部">行銷部</option>
                        <option value="人事部">人事部</option>
                        <option value="財務部">財務部</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-annual-leave">
                        特休天數
                      </label>
                      <input
                        type="number"
                        id="new-employee-annual-leave"
                        name="annualLeave"
                        min={0}
                        max={30}
                        defaultValue={14}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-employee-compensatory-leave">
                      補休天數
                    </label>
                    <input
                      type="number"
                      id="new-employee-compensatory-leave"
                      name="compensatoryLeave"
                      min={0}
                      max={30}
                      defaultValue={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-employee-notes">備註</label>
                    <textarea
                      id="new-employee-notes"
                      name="notes"
                      placeholder="其他備註事項..."
                    ></textarea>
                  </div>
                  <div className="form-actions">
                    <button type="reset" className="btn btn-secondary">
                      重置
                    </button>
                    <button type="submit" className="btn btn-success">
                      新增員工
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
          border: none;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .btn-success {
          background-color: #667eea;
          color: white;
        }
        .btn-success:hover {
          background-color: #5a6fd8;
        }
        .btn-secondary {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }
        .btn-secondary:hover {
          background-color: #e9ecef;
        }
        /* 移除 form-group 的間距，因為 form-actions 已經有 margin-top */
        .form-actions.form-group {
          margin-bottom: 0;
        }
        .status-select {
          padding: 5px 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          background-color: #fff;
          cursor: pointer;
        }
        .status-select.status-pending {
          border-color: #ffc107;
          background-color: #fff3cd;
          color: #856404;
        }
        .status-select.status-approved {
          border-color: #28a745;
          background-color: #d4edda;
          color: #155724;
        }
        .status-select.status-rejected {
          border-color: #dc3545;
          background-color: #f8d7da;
          color: #721c24;
        }
        .filter-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          flex-wrap: wrap;
          align-items: end;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .filter-group label {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }
        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          min-width: 120px;
        }
        .pagination-controls {
          margin-top: 1.5rem;
          padding: 1rem;
          border-top: 1px solid #eee;
        }
        .pagination-info {
          text-align: center;
          color: #666;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .pagination-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        .page-numbers {
          display: flex;
          gap: 0.25rem;
        }
        .page-numbers .btn {
          min-width: 40px;
          padding: 0.5rem;
        }
        .btn-primary {
          background-color: #667eea;
          color: white;
        }
        .btn-primary:hover {
          background-color: #5a6fd8;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .sortable-header {
          cursor: pointer;
          user-select: none;
          position: relative;
          padding-right: 20px;
        }
        .sortable-header:hover {
          background-color: #f8f9fa;
        }
        .sortable-header::after {
          content: "";
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
