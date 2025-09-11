"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [tab, setTab] = useState<"employee" | "admin">("employee");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 切換登入分頁
  const switchTab = (tabName: "employee" | "admin") => {
    setTab(tabName);
    setError("");
  };

  // 處理員工登入
  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: employeeEmail,
          password: employeePassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.role === "employee") {
        // 儲存登入資訊到 localStorage
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name || "員工");
        localStorage.setItem("userEmail", employeeEmail);
        router.push("/employee-dashboard");
      } else {
        setError(data.message || "登入失敗");
      }
    } catch {
      setError("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  };

  // 處理管理員登入
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (data.success && data.role === "admin") {
        // 儲存登入資訊到 localStorage
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name || "管理員");
        localStorage.setItem("userEmail", adminEmail);
        router.push("/admin-dashboard");
      } else {
        setError(data.message || "登入失敗");
      }
    } catch {
      setError("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="logo">
          <h1>請假系統</h1>
          <p>員工假期管理平台</p>
        </div>
        <div className="login-tabs">
          <button
            className={`tab-btn${tab === "employee" ? " active" : ""}`}
            onClick={() => switchTab("employee")}
          >
            員工登入
          </button>
          <button
            className={`tab-btn${tab === "admin" ? " active" : ""}`}
            onClick={() => switchTab("admin")}
          >
            管理員登入
          </button>
        </div>
        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
        {tab === "employee" && (
          <div className="login-form">
            <form onSubmit={handleEmployeeLogin}>
              <div className="form-group">
                <label htmlFor="employee-email">員工 Email</label>
                <input
                  type="email"
                  id="employee-email"
                  required
                  placeholder="請輸入您的 Email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="employee-password">密碼</label>
                <input
                  type="password"
                  id="employee-password"
                  required
                  placeholder="請輸入密碼"
                  value={employeePassword}
                  onChange={(e) => setEmployeePassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "登入中..." : "登入"}
              </button>
            </form>
          </div>
        )}
        {tab === "admin" && (
          <div className="login-form">
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label htmlFor="admin-email">管理員 Email</label>
                <input
                  type="email"
                  id="admin-email"
                  required
                  placeholder="請輸入管理員 Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="admin-password">密碼</label>
                <input
                  type="password"
                  id="admin-password"
                  required
                  placeholder="請輸入密碼"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "登入中..." : "登入"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
