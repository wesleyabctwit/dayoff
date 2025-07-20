'use client';

import React, { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  // 狀態
  const [overview, setOverview] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 依分頁載入資料
  useEffect(() => {
    setError('');
    setLoading(true);
    if (tab === 'overview') {
      fetch('/api/admin-dashboard/overview')
        .then(res => res.json())
        .then(data => setOverview(data))
        .catch(() => setError('載入失敗'))
        .finally(() => setLoading(false));
    } else if (tab === 'employees') {
      fetch('/api/admin-dashboard/employees')
        .then(res => res.json())
        .then(data => setEmployees(data.employees))
        .catch(() => setError('載入失敗'))
        .finally(() => setLoading(false));
    } else if (tab === 'requests') {
      fetch('/api/admin-dashboard/requests')
        .then(res => res.json())
        .then(data => setRequests(data.requests))
        .catch(() => setError('載入失敗'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

  // 處理新增員工表單提交
  const addEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    alert('已新增員工（範例）');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="header">
          <h1>管理員儀表板</h1>
          <div className="user-info">
            <span>歡迎，<span id="user-name">管理員</span></span>
            <button className="logout-btn">登出</button>
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>總覽</button>
          <button className={`nav-tab${tab === 'employees' ? ' active' : ''}`} onClick={() => setTab('employees')}>員工管理</button>
          <button className={`nav-tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>請假審核</button>
          <button className={`nav-tab${tab === 'add-employee' ? ' active' : ''}`} onClick={() => setTab('add-employee')}>新增員工</button>
        </div>
        <div className="content">
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {loading && <div>載入中...</div>}
          {/* 總覽頁面 */}
          {tab === 'overview' && overview && !loading && (
            <div id="overview" className="tab-content">
              <div className="card">
                <h3>系統統計</h3>
                <div className="leave-balance">
                  <div className="balance-item">
                    <h4>總員工數</h4>
                    <div className="amount">{overview.stats.totalEmployees}</div>
                    <div>人</div>
                  </div>
                  <div className="balance-item">
                    <h4>待審核申請</h4>
                    <div className="amount">{overview.stats.pendingRequests}</div>
                    <div>件</div>
                  </div>
                  <div className="balance-item">
                    <h4>本月請假</h4>
                    <div className="amount">{overview.stats.leavesThisMonth}</div>
                    <div>次</div>
                  </div>
                  <div className="balance-item">
                    <h4>特休使用率</h4>
                    <div className="amount">{overview.stats.annualLeaveUsage}</div>
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
                      {overview.activities.map((a: any, i: number) => (
                        <tr key={i}>
                          <td>{a.time}</td>
                          <td>{a.employee}</td>
                          <td>{a.action}</td>
                          <td><span className={`status ${a.status}`}>{a.status === 'pending' ? '待審核' : a.status === 'approved' ? '已核准' : a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* 員工管理頁面 */}
          {tab === 'employees' && !loading && (
            <div id="employees" className="tab-content">
              <div className="card">
                <h3>員工列表</h3>
                <div id="employee-list" className="table-container">
                  {employees.length === 0 ? <span>尚無員工資料</span> : (
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
                        {employees.map((emp, i) => (
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
          {tab === 'requests' && !loading && (
            <div id="requests" className="tab-content">
              <div className="card">
                <h3>待審核請假申請</h3>
                <div id="pending-requests" className="table-container">
                  {requests.length === 0 ? <span>尚無待審核申請</span> : (
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
                        {requests.map((req, i) => (
                          <tr key={i}>
                            <td>{req.employee}</td>
                            <td>{req.date}</td>
                            <td>{req.type}</td>
                            <td>{req.days}</td>
                            <td><span className={`status ${req.status}`}>{req.status === 'pending' ? '待審核' : req.status}</span></td>
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
          {tab === 'add-employee' && (
            <div id="add-employee" className="tab-content">
              <div className="card">
                <h3>新增員工</h3>
                <form onSubmit={addEmployee}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-name">姓名</label>
                      <input type="text" id="new-employee-name" name="name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-email">Email</label>
                      <input type="email" id="new-employee-email" name="email" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-hire-date">到職日</label>
                      <input type="date" id="new-employee-hire-date" name="hireDate" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-department">部門</label>
                      <select id="new-employee-department" name="department" required>
                        <option value="">請選擇部門</option>
                        <option value="技術部">技術部</option>
                        <option value="行銷部">行銷部</option>
                        <option value="人事部">人事部</option>
                        <option value="財務部">財務部</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-employee-annual-leave">特休天數</label>
                      <input type="number" id="new-employee-annual-leave" name="annualLeave" min="0" max="30" defaultValue={14} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-employee-compensatory-leave">補休天數</label>
                      <input type="number" id="new-employee-compensatory-leave" name="compensatoryLeave" min="0" max="30" defaultValue={0} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-employee-notes">備註</label>
                    <textarea id="new-employee-notes" name="notes" placeholder="其他備註事項..."></textarea>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-success">新增員工</button>
                    <button type="reset" className="btn btn-secondary">重置</button>
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