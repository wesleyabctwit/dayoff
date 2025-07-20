'use client';

import React, { useState } from "react";

export default function EmployeeDashboard() {
  const [tab, setTab] = useState('overview');

  // 切換分頁
  const showTab = (tabName: string) => setTab(tabName);

  // 處理請假申請表單提交
  const submitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    alert('已提交請假申請（範例）');
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="header">
          <h1>員工儀表板</h1>
          <div className="user-info">
            <span>歡迎，<span id="user-name">員工</span></span>
            <button className="logout-btn">登出</button>
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => showTab('overview')}>總覽</button>
          <button className={`nav-tab${tab === 'apply' ? ' active' : ''}`} onClick={() => showTab('apply')}>請假申請</button>
          <button className={`nav-tab${tab === 'history' ? ' active' : ''}`} onClick={() => showTab('history')}>請假紀錄</button>
        </div>
        <div className="content">
          {/* 總覽頁面 */}
          {tab === 'overview' && (
            <div id="overview" className="tab-content">
              <div className="card">
                <h3>假期餘額</h3>
                <div id="leave-balance" className="leave-balance">
                  {/* 假期餘額將由 JavaScript 載入 */}
                  <span>特休：10 天，病假：5 天</span>
                </div>
              </div>
              <div className="card">
                <h3>個人資料</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名</label>
                    <input type="text" value="張小明" readOnly />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value="ming@company.com" readOnly />
                  </div>
                  <div className="form-group">
                    <label>到職日</label>
                    <input type="date" value="2023-01-15" readOnly />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 請假申請頁面 */}
          {tab === 'apply' && (
            <div id="apply" className="tab-content">
              <div className="card">
                <h3>請假申請</h3>
                <form onSubmit={submitLeaveRequest}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="leave-date">請假日期</label>
                      <input type="date" id="leave-date" name="leave-date" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="leave-period">時段</label>
                      <select id="leave-period" name="leave-period" required>
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
                      <select id="leave-type" name="leave-type" required>
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
                      <input type="number" id="leave-days" name="leave-days" min="0.5" max="30" step="0.5" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="leave-reason">請假原因</label>
                    <textarea id="leave-reason" name="leave-reason" placeholder="請詳細說明請假原因..." required></textarea>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-success">提交申請</button>
                    <button type="reset" className="btn btn-secondary">重置</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* 請假紀錄頁面 */}
          {tab === 'history' && (
            <div id="history" className="tab-content">
              <div className="card">
                <h3>請假紀錄</h3>
                <div id="leave-history" className="table-container">
                  {/* 請假紀錄將由 JavaScript 載入 */}
                  <span>尚無請假紀錄</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 