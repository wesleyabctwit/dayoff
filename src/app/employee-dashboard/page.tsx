"use client";

import React, { useState, useEffect } from "react";

type OverviewResponse = {
  balance: { annual: number; sick: number };
  profile: { name: string; email: string; hireDate: string };
};

type HistoryItem = {
  date: string;
  type: string;
  period: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | string;
};

type LeaveForm = {
  date: string;
  period: string;
  type: string;
  days: string;
  reason: string;
};

export default function EmployeeDashboard() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("員工");

  // 篩選和排序狀態
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // 日期驗證狀態
  const [dateError, setDateError] = useState("");

  // 獲取今天日期作為最小可選日期
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // 驗證日期是否有效
  const validateDate = (dateString: string) => {
    if (!dateString) {
      setDateError("");
      return true;
    }

    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setDateError("請假日期不能選擇過去的日期");
      return false;
    }

    setDateError("");
    return true;
  };

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
  // 請假申請表單
  const [form, setForm] = useState<LeaveForm>({
    date: "",
    period: "",
    type: "",
    days: "",
    reason: "",
  });
  const [submitMsg, setSubmitMsg] = useState("");

  // 依分頁載入資料
  useEffect(() => {
    setError("");
    setLoading(true);

    // 獲取當前使用者的 email
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setError("無法獲取使用者資訊，請重新登入");
      setLoading(false);
      return;
    }

    if (tab === "overview") {
      fetch(
        `/api/employee-dashboard/overview?email=${encodeURIComponent(
          userEmail
        )}`
      )
        .then((res) => res.json())
        .then((data: OverviewResponse) => setOverview(data))
        .catch(() => setError("載入失敗"))
        .finally(() => setLoading(false));
    } else if (tab === "history") {
      const params = new URLSearchParams({
        email: userEmail,
      });

      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedType) params.append("type", selectedType);
      if (sortField) {
        params.append("sortField", sortField);
        params.append("sortDirection", sortDirection);
      }

      fetch(`/api/employee-dashboard/leave-history?${params.toString()}`)
        .then((res) => res.json())
        .then((data: { history: HistoryItem[] }) => setHistory(data.history))
        .catch(() => setError("載入失敗"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [
    tab,
    selectedYear,
    selectedMonth,
    selectedType,
    sortField,
    sortDirection,
  ]);

  // 處理篩選條件變更
  const handleFilterChange = (type: string, value: string) => {
    if (type === "year") {
      setSelectedYear(value);
    } else if (type === "month") {
      setSelectedMonth(value);
    } else if (type === "type") {
      setSelectedType(value);
    }
  };

  // 清除篩選條件
  const clearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedType("");
  };

  // 處理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 取得排序圖示
  const getSortIcon = (field: string) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // 處理請假申請表單送出
  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg("");
    setLoading(true);

    // 獲取當前使用者的 email
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setSubmitMsg("無法獲取使用者資訊，請重新登入");
      setLoading(false);
      return;
    }

    // 驗證日期不能是過去的日期
    if (!validateDate(form.date)) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/employee-dashboard/submit-leave?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data: { success: boolean } = await res.json();
      if (data.success) {
        setSubmitMsg("申請成功！");
        setForm({ date: "", period: "", type: "", days: "", reason: "" });
      } else {
        setSubmitMsg("申請失敗");
      }
    } catch {
      setSubmitMsg("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="header">
          <h1>員工儀表板</h1>
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
            className={`nav-tab${tab === "apply" ? " active" : ""}`}
            onClick={() => setTab("apply")}
          >
            請假申請
          </button>
          <button
            className={`nav-tab${tab === "history" ? " active" : ""}`}
            onClick={() => setTab("history")}
          >
            請假紀錄
          </button>
        </div>
        <div className="content">
          {error && (
            <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
          )}
          {loading && <div>載入中...</div>}
          {/* 總覽頁面 */}
          {tab === "overview" && overview && !loading && (
            <div id="overview" className="tab-content">
              <div className="card">
                <h3>假期餘額</h3>
                <div id="leave-balance" className="leave-balance">
                  <span>
                    特休：{overview.balance.annual} 天，病假：
                    {overview.balance.sick} 天
                  </span>
                </div>
              </div>
              <div className="card">
                <h3>個人資料</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名</label>
                    <input type="text" value={overview.profile.name} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={overview.profile.email}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>到職日</label>
                    <input
                      type="date"
                      value={overview.profile.hireDate}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 請假申請頁面 */}
          {tab === "apply" && (
            <div id="apply" className="tab-content">
              <div className="card form-card">
                <div className="form-header">
                  <h3>請假申請</h3>
                  <p className="form-description">請填寫以下資訊提交請假申請</p>
                </div>
                <form onSubmit={submitLeaveRequest} className="leave-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="leave-date">請假日期</label>
                      <input
                        type="date"
                        id="leave-date"
                        name="leave-date"
                        required
                        min={getTodayString()}
                        value={form.date}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setForm((f) => ({ ...f, date: newDate }));
                          validateDate(newDate);
                        }}
                      />
                      {dateError && (
                        <div className="field-error">
                          <span className="error-icon">⚠</span>
                          {dateError}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="leave-period">時段</label>
                      <select
                        id="leave-period"
                        name="leave-period"
                        required
                        value={form.period}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, period: e.target.value }))
                        }
                      >
                        <option value="">請選擇時段</option>
                        <option value="全天">全天</option>
                        <option value="上午">上午</option>
                        <option value="下午">下午</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="leave-type">假別</label>
                      <select
                        id="leave-type"
                        name="leave-type"
                        required
                        value={form.type}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, type: e.target.value }))
                        }
                      >
                        <option value="">請選擇假別</option>
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
                    <div className="form-group">
                      <label htmlFor="leave-days">天數</label>
                      <input
                        type="number"
                        id="leave-days"
                        name="leave-days"
                        min="0.5"
                        max="30"
                        step="0.5"
                        required
                        value={form.days}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, days: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="leave-reason">請假原因</label>
                    <textarea
                      id="leave-reason"
                      name="leave-reason"
                      placeholder="請詳細說明請假原因..."
                      required
                      value={form.reason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reason: e.target.value }))
                      }
                    ></textarea>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary btn-large"
                      disabled={loading}
                    >
                      {loading ? "送出中..." : "提交申請"}
                    </button>
                    <button
                      type="reset"
                      className="btn btn-outline btn-large"
                      onClick={() => {
                        setForm({
                          date: "",
                          period: "",
                          type: "",
                          days: "",
                          reason: "",
                        });
                        setDateError("");
                        setSubmitMsg("");
                      }}
                    >
                      重置
                    </button>
                  </div>
                  {submitMsg && (
                    <div
                      className={`submit-message ${
                        submitMsg.includes("成功") ? "success" : "error"
                      }`}
                    >
                      <div className="message-icon">
                        {submitMsg.includes("成功") ? "✓" : "⚠"}
                      </div>
                      <span>{submitMsg}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
          {/* 請假紀錄頁面 */}
          {tab === "history" && !loading && (
            <div id="history" className="tab-content">
              <div className="card">
                <h3>請假紀錄</h3>

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
                    <label htmlFor="type-filter">假別：</label>
                    <select
                      id="type-filter"
                      value={selectedType}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
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

                <div id="leave-history" className="table-container">
                  {history.length === 0 ? (
                    <span>尚無符合條件的請假紀錄</span>
                  ) : (
                    <table>
                      <thead>
                        <tr>
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
                            onClick={() => handleSort("period")}
                          >
                            時段 {getSortIcon("period")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("days")}
                          >
                            天數 {getSortIcon("days")}
                          </th>
                          <th
                            className="sortable-header"
                            onClick={() => handleSort("reason")}
                          >
                            原因 {getSortIcon("reason")}
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
                        {history.map((h: HistoryItem, i) => (
                          <tr key={i}>
                            <td>{h.date}</td>
                            <td>{h.type}</td>
                            <td>{h.period}</td>
                            <td>{h.days}</td>
                            <td>{h.reason}</td>
                            <td>
                              <span className={`status ${h.status}`}>
                                {h.status === "pending"
                                  ? "待審核"
                                  : h.status === "approved"
                                  ? "已核准"
                                  : h.status}
                              </span>
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
        </div>
      </div>
      <style jsx>{`
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
        /* 表單控制項樣式 */
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }
        .form-group input:hover,
        .form-group select:hover,
        .form-group textarea:hover {
          border-color: #c7d2fe;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.95rem;
        }
        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        /* 按鈕樣式 */
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          min-width: 120px;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn:active {
          transform: translateY(0);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          min-width: 140px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-outline {
          background-color: transparent;
          color: #667eea;
          border-color: #667eea;
        }
        .btn-outline:hover:not(:disabled) {
          background-color: #667eea;
          color: white;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }

        /* 表單操作區域 */
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #f1f5f9;
        }

        /* 表單卡片樣式 */
        .form-card {
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e5e9;
        }
        .form-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f5f9;
        }
        .form-header h3 {
          color: #1f2937;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }
        .form-description {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }
        .leave-form {
          padding: 0;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        /* 提交訊息樣式 */
        .submit-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 1.5rem;
          animation: slideIn 0.3s ease-out;
        }
        .submit-message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 2px solid #10b981;
        }
        .submit-message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 2px solid #ef4444;
        }
        .message-icon {
          font-size: 1.25rem;
          font-weight: bold;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 欄位錯誤訊息樣式 */
        .field-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          animation: slideIn 0.2s ease-out;
        }
        .error-icon {
          font-size: 1rem;
          font-weight: bold;
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
      `}</style>
    </div>
  );
}
