'use client';

import React from "react";

export default function Home() {
  return (
    <div className="container">
      <div className="login-container">
        <div className="logo">
          <h1>請假系統</h1>
          <p>員工假期管理平台</p>
        </div>
        <div className="login-tabs">
          <button className="tab-btn active" onClick={() => switchTab('employee')}>員工登入</button>
          <button className="tab-btn" onClick={() => switchTab('admin')}>管理員登入</button>
        </div>
        <div id="employee-login" className="login-form">
          <form onSubmit={handleEmployeeLogin}>
            <div className="form-group">
              <label htmlFor="employee-email">員工 Email</label>
              <input type="email" id="employee-email" required placeholder="請輸入您的 Email" />
            </div>
            <div className="form-group">
              <label htmlFor="employee-password">密碼</label>
              <input type="password" id="employee-password" required placeholder="請輸入密碼" />
            </div>
            <button type="submit" className="btn-primary">登入</button>
          </form>
        </div>
        <div id="admin-login" className="login-form" style={{ display: 'none' }}>
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label htmlFor="admin-email">管理員 Email</label>
              <input type="email" id="admin-email" required placeholder="請輸入管理員 Email" />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">密碼</label>
              <input type="password" id="admin-password" required placeholder="請輸入密碼" />
            </div>
            <button type="submit" className="btn-primary">登入</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// 切換登入分頁
function switchTab(tab) {
  if (typeof window === 'undefined') return;
  const employeeLogin = document.getElementById('employee-login');
  const adminLogin = document.getElementById('admin-login');
  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tab === 'employee') {
    employeeLogin.style.display = '';
    adminLogin.style.display = 'none';
    tabBtns[0].classList.add('active');
    tabBtns[1].classList.remove('active');
  } else {
    employeeLogin.style.display = 'none';
    adminLogin.style.display = '';
    tabBtns[0].classList.remove('active');
    tabBtns[1].classList.add('active');
  }
}

// 處理員工登入
function handleEmployeeLogin(e) {
  e.preventDefault();
  // TODO: 實作登入邏輯
  alert('員工登入成功（範例）');
}

// 處理管理員登入
function handleAdminLogin(e) {
  e.preventDefault();
  // TODO: 實作登入邏輯
  alert('管理員登入成功（範例）');
}
