import React, { useState, useEffect } from "react";
import { OvertimeActivity, EmployeeItem } from "../types";

interface OvertimeManagementTabProps {
  employees: EmployeeItem[];
}

const OvertimeManagementTab: React.FC<OvertimeManagementTabProps> = ({
  employees,
}) => {
  const [overtimeActivities, setOvertimeActivities] = useState<
    OvertimeActivity[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddOvertimeForm, setShowAddOvertimeForm] = useState(false);
  const [editingOvertimeId, setEditingOvertimeId] = useState<string | null>(
    null
  );

  useEffect(() => {
    refreshOvertimeActivitiesWithFilter("", "");
  }, []);

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
    <div id="overtime" className="tab-content">
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>補休管理</h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingOvertimeId(null);
              setShowAddOvertimeForm(true);
            }}
          >
            新增活動加班
          </button>
        </div>

        {/* 新增/編輯活動表單 */}
        {showAddOvertimeForm && (
          <div
            className="card"
            style={{ marginBottom: "20px", backgroundColor: "#f8f9fa" }}
          >
            <h4>{editingOvertimeId ? "編輯活動" : "新增活動加班"}</h4>
            <form id="overtime-form" onSubmit={handleAddOvertimeActivity}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="activity-name">活動名稱</label>
                  <input type="text" id="activity-name" name="name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="activity-date">活動日期</label>
                  <input type="date" id="activity-date" name="date" required />
                </div>
                <div className="form-group">
                  <label htmlFor="activity-hours">補休時數</label>
                  <input
                    type="number"
                    id="activity-hours"
                    name="hours"
                    min="0.5"
                    step="0.5"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>參與員工</label>
                <div className="participants-list">
                  {employees.map((emp) => (
                    <label key={emp.email}>
                      <input
                        type="checkbox"
                        name="participants"
                        value={emp.email}
                      />
                      {emp.name} ({emp.email})
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="activity-description">活動描述</label>
                <textarea
                  id="activity-description"
                  name="description"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {editingOvertimeId ? "更新活動" : "新增活動"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddOvertimeForm(false);
                    setEditingOvertimeId(null);
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 活動列表 */}
        {/* 篩選控制項 */}
        <div
          className="filter-controls"
          style={{
            marginBottom: "12px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div className="filter-group">
            <label htmlFor="overtime-year">年份：</label>
            <select
              id="overtime-year"
              onChange={(e) =>
                refreshOvertimeActivitiesWithFilter(
                  e.target.value,
                  (
                    document.getElementById(
                      "overtime-month"
                    ) as HTMLSelectElement
                  )?.value || ""
                )
              }
              defaultValue=""
            >
              <option value="">全部年份</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="overtime-month">月份：</label>
            <select
              id="overtime-month"
              onChange={(e) =>
                refreshOvertimeActivitiesWithFilter(
                  (
                    document.getElementById(
                      "overtime-year"
                    ) as HTMLSelectElement
                  )?.value || "",
                  e.target.value
                )
              }
              defaultValue=""
            >
              <option value="">全部月份</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, "0");
                return (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="table-container">
          {overtimeActivities.length === 0 ? (
            <span>尚無活動記錄</span>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>活動名稱</th>
                  <th>活動日期</th>
                  <th>補休時數</th>
                  <th>參與員工</th>
                  <th>活動描述</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {overtimeActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.name}</td>
                    <td>{activity.date}</td>
                    <td>{activity.hours} 天</td>
                    <td>{activity.participantNames}</td>
                    <td>{activity.description || "-"}</td>
                    <td>{formatDateTime(activity.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditOvertimeActivity(activity)}
                        style={{ marginRight: "5px" }}
                      >
                        編輯
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() =>
                          handleDeleteOvertimeActivity(activity.id)
                        }
                      >
                        刪除
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
  );
};

export default OvertimeManagementTab;
