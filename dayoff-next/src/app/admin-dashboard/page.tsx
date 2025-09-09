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
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  // 狀態
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("管理員");

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
      fetch("/api/admin-dashboard/employees")
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then((data: { employees: EmployeeItem[] }) =>
          setEmployees(Array.isArray(data?.employees) ? data.employees : [])
        )
        .catch(() => {
          setEmployees([]);
          setError("載入失敗");
        })
        .finally(() => setLoading(false));
    } else if (tab === "requests") {
      fetch("/api/admin-dashboard/requests")
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then((data: { requests: RequestItem[] }) =>
          setRequests(Array.isArray(data?.requests) ? data.requests : [])
        )
        .catch(() => {
          setRequests([]);
          setError("載入失敗");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

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
          <button
            className={`nav-tab${tab === "add-employee" ? " active" : ""}`}
            onClick={() => setTab("add-employee")}
          >
            新增員工
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
                <h3>員工列表</h3>
                <div id="employee-list" className="table-container">
                  {employees.length === 0 ? (
                    <span>尚無員工資料</span>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>姓名</th>
                          <th>Email</th>
                          <th>到職日</th>
                          <th>部門</th>
                          <th>特休天數</th>
                          <th>補休天數</th>
                          <th>備註</th>
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
                <h3>待審核請假申請</h3>
                <div id="pending-requests" className="table-container">
                  {requests.length === 0 ? (
                    <span>尚無待審核申請</span>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>員工</th>
                          <th>日期</th>
                          <th>假別</th>
                          <th>天數</th>
                          <th>狀態</th>
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
                              <span className={`status ${req.status}`}>
                                {req.status === "pending"
                                  ? "待審核"
                                  : req.status}
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
                  <div className="form-group">
                    <button type="submit" className="btn btn-success">
                      新增員工
                    </button>
                    <button type="reset" className="btn btn-secondary">
                      重置
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
