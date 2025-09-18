"use client";

import React, { useState, useEffect } from "react";
import OverviewTab from "./components/OverviewTab";
import EmployeeManagementTab from "./components/EmployeeManagementTab";
import RequestApprovalTab from "./components/RequestApprovalTab";
import OvertimeManagementTab from "./components/OvertimeManagementTab";
import AddEditEmployeeForm from "./components/AddEditEmployeeForm";
import {
  OverviewResponse,
  EmployeeItem,
  RequestItem,
  PaginationInfo,
  OvertimeActivity,
} from "./types";

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

  // 補休管理相關狀態
  const [overtimeActivities, setOvertimeActivities] = useState<
    OvertimeActivity[]
  >([]);
  const [showAddOvertimeForm, setShowAddOvertimeForm] = useState(false);
  const [editingOvertimeId, setEditingOvertimeId] = useState<string | null>(
    null
  );

  // 分頁和篩選狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // 排序狀態
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // 員工編輯狀態
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);

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
      if (selectedType) params.append("type", selectedType);
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
    } else if (tab === "overtime") {
      fetch("/api/admin-dashboard/overtime-activities")
        .then((res) => {
          if (!res.ok) throw new Error("載入失敗");
          return res.json();
        })
        .then((data: OvertimeActivity[]) =>
          setOvertimeActivities(Array.isArray(data) ? data : [])
        )
        .catch(() => {
          setOvertimeActivities([]);
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
    selectedType,
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
      // 各種假別的天數設定
      特休: formData.get("特休") as string,
      補休: formData.get("補休") as string,
      事假: formData.get("事假") as string,
      病假: formData.get("病假") as string,
      喪假: formData.get("喪假") as string,
      育嬰假: formData.get("育嬰假") as string,
      產假: formData.get("產假") as string,
      婚假: formData.get("婚假") as string,
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

  // 重新載入目前的請假清單（依目前的篩選、排序、分頁）
  const refreshRequests = async () => {
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
      await refreshRequests();
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

  // 處理編輯員工
  const handleEditEmployee = (employee: EmployeeItem) => {
    setEditingEmployee(employee);
    setIsEditMode(true);
    setTab("add-employee");
  };

  // 處理新增員工按鈕
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsEditMode(false);
    setTab("add-employee");
  };

  // 處理重置按鈕
  const handleReset = () => {
    if (isEditMode && editingEmployee) {
      // 編輯模式：恢復到原始資料
      const form = document.querySelector(
        "#add-employee form"
      ) as HTMLFormElement;
      if (form) {
        (form.querySelector('[name="name"]') as HTMLInputElement).value =
          editingEmployee.name;
        (form.querySelector('[name="email"]') as HTMLInputElement).value =
          editingEmployee.email;
        (form.querySelector('[name="password"]') as HTMLInputElement).value =
          editingEmployee.password;
        (form.querySelector('[name="hireDate"]') as HTMLInputElement).value =
          editingEmployee.hireDate;
        (form.querySelector('[name="department"]') as HTMLSelectElement).value =
          editingEmployee.department;
        (form.querySelector('[name="特休"]') as HTMLInputElement).value =
          editingEmployee.特休.toString();
        (form.querySelector('[name="補休"]') as HTMLInputElement).value =
          editingEmployee.補休.toString();
        (form.querySelector('[name="事假"]') as HTMLInputElement).value =
          editingEmployee.事假.toString();
        (form.querySelector('[name="病假"]') as HTMLInputElement).value =
          editingEmployee.病假.toString();
        (form.querySelector('[name="喪假"]') as HTMLInputElement).value =
          editingEmployee.喪假.toString();
        (form.querySelector('[name="育嬰假"]') as HTMLInputElement).value =
          editingEmployee.育嬰假.toString();
        (form.querySelector('[name="產假"]') as HTMLInputElement).value =
          editingEmployee.產假.toString();
        (form.querySelector('[name="婚假"]') as HTMLInputElement).value =
          editingEmployee.婚假.toString();
        (form.querySelector('[name="notes"]') as HTMLTextAreaElement).value =
          editingEmployee.notes;
      }
    } else {
      // 新增模式：清空表單
      const form = document.querySelector(
        "#add-employee form"
      ) as HTMLFormElement;
      if (form) {
        form.reset();
      }
    }
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

  // 重新載入補休活動清單
  const refreshOvertimeActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const yearSel = document.getElementById(
        "overtime-year"
      ) as HTMLSelectElement | null;
      const monthSel = document.getElementById(
        "overtime-month"
      ) as HTMLSelectElement | null;
      const year = yearSel?.value || "";
      const month = monthSel?.value || "";

      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);

      const res = await fetch(
        `/api/admin-dashboard/overtime-activities${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      if (!res.ok) throw new Error("載入失敗");
      const data: OvertimeActivity[] = await res.json();
      setOvertimeActivities(Array.isArray(data) ? data : []);
    } catch {
      setOvertimeActivities([]);
      setError("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  // 依指定過濾條件重新載入
  const refreshOvertimeActivitiesWithFilter = async (
    year: string,
    month: string
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      const res = await fetch(
        `/api/admin-dashboard/overtime-activities${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      if (!res.ok) throw new Error("載入失敗");
      const data: OvertimeActivity[] = await res.json();
      setOvertimeActivities(Array.isArray(data) ? data : []);
    } catch {
      setOvertimeActivities([]);
      setError("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  // 處理新增活動加班
  const handleAddOvertimeActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const selectedEmployees = Array.from(
      form.querySelectorAll('input[name="participants"]:checked')
    ).map((input) => (input as HTMLInputElement).value);

    if (selectedEmployees.length === 0) {
      setError("請至少選擇一位參與員工");
      setLoading(false);
      return;
    }

    const data = {
      name: formData.get("name") as string,
      date: formData.get("date") as string,
      hours: formData.get("hours") as string,
      participants: selectedEmployees,
      description: formData.get("description") as string,
    };

    try {
      const url = "/api/admin-dashboard/overtime-activities";
      const method = editingOvertimeId ? "PUT" : "POST";
      const body = editingOvertimeId
        ? { ...data, id: editingOvertimeId }
        : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        alert(editingOvertimeId ? "活動更新成功！" : "活動新增成功！");
        form.reset();
        setShowAddOvertimeForm(false);
        setEditingOvertimeId(null);
        await refreshOvertimeActivities();
      } else {
        setError(result.message || "操作失敗");
      }
    } catch {
      setError("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  };

  // 處理編輯活動
  const handleEditOvertimeActivity = (activity: OvertimeActivity) => {
    setEditingOvertimeId(activity.id);
    setShowAddOvertimeForm(true);

    // 填入表單資料
    setTimeout(() => {
      const form = document.querySelector("#overtime-form") as HTMLFormElement;
      if (form) {
        (form.querySelector('[name="name"]') as HTMLInputElement).value =
          activity.name;
        (form.querySelector('[name="date"]') as HTMLInputElement).value =
          activity.date;
        (form.querySelector('[name="hours"]') as HTMLInputElement).value =
          activity.hours;
        (
          form.querySelector('[name="description"]') as HTMLTextAreaElement
        ).value = activity.description || "";

        // 勾選參與員工
        activity.participantEmails.forEach((email) => {
          const checkbox = form.querySelector(
            `input[name="participants"][value="${email}"]`
          ) as HTMLInputElement;
          if (checkbox) checkbox.checked = true;
        });
      }
    }, 100);
  };

  // 處理刪除活動
  const handleDeleteOvertimeActivity = async (id: string) => {
    if (!confirm("確定要刪除此活動嗎？這將會從參與員工扣回相應的補休時數。")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin-dashboard/overtime-activities?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();
      if (result.success) {
        alert("活動刪除成功！");
        await refreshOvertimeActivities();
      } else {
        setError(result.message || "刪除失敗");
      }
    } catch {
      setError("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div
        className="dashboard"
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div className="header">
          <h1>為你社區服務｜人員出勤系統｜管理後台</h1>
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
            className={`nav-tab${tab === "overtime" ? " active" : ""}`}
            onClick={() => setTab("overtime")}
          >
            補休管理
          </button>
        </div>
        <div
          className="content"
          style={{ flex: 1, minHeight: "calc(100vh - 200px)" }}
        >
          {error && (
            <div style={{ color: "red", marginBottom: 16 }}>{error}</div>
          )}
          {loading && (
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
          )}
          {/* 總覽頁面 */}
          {tab === "overview" && (
            <OverviewTab overview={overview} loading={loading} error={error} />
          )}
          {/* 員工管理頁面 */}
          {tab === "employees" && (
            <EmployeeManagementTab
              employees={employees}
              loading={loading}
              handleSort={handleSort}
              getSortIcon={getSortIcon}
              handleAddEmployee={handleAddEmployee}
              handleEditEmployee={handleEditEmployee}
            />
          )}
          {/* 請假審核頁面 */}
          {tab === "requests" && <RequestApprovalTab />}
          {/* 補休管理頁面 */}
          {tab === "overtime" && (
            <OvertimeManagementTab employees={employees} />
          )}
          {/* 新增/編輯員工頁面 */}
          {tab === "add-employee" && (
            <AddEditEmployeeForm
              isEditMode={isEditMode}
              editingEmployee={editingEmployee}
              loading={loading}
              error={error}
              addEmployee={addEmployee}
              handleReset={handleReset}
            />
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
        .form-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .form-section h4 {
          margin: 0 0 1.5rem 0;
          color: #495057;
          font-size: 1.1rem;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 0.5rem;
        }
        .form-group input[type="number"] {
          background-color: #fff;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          padding: 0.75rem;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .form-group input[type="number"]:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .form-group input[type="number"]:hover {
          border-color: #c7d2fe;
        }
        .remaining-days {
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .remaining-days.sufficient {
          background-color: #d1fae5;
          color: #065f46;
        }
        .remaining-days.insufficient {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .leave-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .leave-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        .leave-stat-item:hover {
          background-color: #e9ecef;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .leave-type {
          font-weight: 600;
          color: #495057;
          font-size: 1rem;
        }
        .leave-count {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .content {
          flex: 1;
          min-height: calc(100vh - 200px);
        }
        .tab-content {
          min-height: 400px;
        }
        .card {
          min-height: 200px;
        }
        .table-container {
          min-height: 300px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        thead {
          background-color: #f8f9fa;
        }
        th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
          font-size: 0.9rem;
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #dee2e6;
          color: #495057;
          font-size: 0.9rem;
        }
        tbody tr:hover {
          background-color: #f8f9fa;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .loading-container {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #666;
        }
        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: #6c757d;
        }
        .readonly {
          background-color: #f8f9fa;
          color: #6c757d;
          cursor: not-allowed;
        }
        .btn-outline {
          background-color: transparent;
          color: #667eea;
          border: 2px solid #667eea;
        }
        .btn-outline:hover:not(:disabled) {
          background-color: #667eea;
          color: white;
        }
        .btn-primary {
          background-color: #667eea;
          color: white;
          border: 2px solid #667eea;
        }
        .btn-primary:hover:not(:disabled) {
          background-color: #5a6fd8;
          border-color: #5a6fd8;
        }
        .hint-text {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
      `}</style>
    </div>
  );
}
