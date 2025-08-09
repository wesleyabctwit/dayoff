'use client';

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
  status: 'pending' | 'approved' | 'rejected' | string;
};

type LeaveForm = {
  date: string;
  period: string;
  type: string;
  days: string;
  reason: string;
};

export default function EmployeeDashboard() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('員工');

  // 載入使用者資訊
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  // 登出功能
  const handleLogout = () => {
    // 清除本地儲存的登入資訊
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // 重導向到首頁
    window.location.href = '/';
  };
  // 請假申請表單
  const [form, setForm] = useState<LeaveForm>({
    date: '',
    period: '',
    type: '',
    days: '',
    reason: ''
  });
  const [submitMsg, setSubmitMsg] = useState('');

  // 依分頁載入資料
  useEffect(() => {
    setError('');
    setLoading(true);
    if (tab === 'overview') {
      fetch('/api/employee-dashboard/overview')
        .then(res => res.json())
        .then((data: OverviewResponse) => setOverview(data))
        .catch(() => setError('載入失敗'))
        .finally(() => setLoading(false));
    } else if (tab === 'history') {
      fetch('/api/employee-dashboard/leave-history')
        .then(res => res.json())
        .then((data: { history: HistoryItem[] }) => setHistory(data.history))
        .catch(() => setError('載入失敗'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

  // 處理請假申請表單送出
  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/employee-dashboard/submit-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data: { success: boolean } = await res.json();
      if (data.success) {
        setSubmitMsg('申請成功！');
        setForm({ date: '', period: '', type: '', days: '', reason: '' });
      } else {
        setSubmitMsg('申請失敗');
      }
    } catch {
      setSubmitMsg('伺服器錯誤');
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
            <span>歡迎，<span id="user-name">{userName}</span></span>
            <button className="logout-btn" onClick={handleLogout}>登出</button>
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>總覽</button>
          <button className={`nav-tab${tab === 'apply' ? ' active' : ''}`} onClick={() => setTab('apply')}>請假申請</button>
          <button className={`nav-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>請假紀錄</button>
        </div>
        <div className="content">
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          {loading && <div>載入中...</div>}
          {/* 總覽頁面 */}
          {tab === 'overview' && overview && !loading && (
            <div id="overview" className="tab-content">
              <div className="card">
                <h3>假期餘額</h3>
                <div id="leave-balance" className="leave-balance">
                  <span>特休：{overview.balance.annual} 天，病假：{overview.balance.sick} 天</span>
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
                    <input type="email" value={overview.profile.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label>到職日</label>
                    <input type="date" value={overview.profile.hireDate} readOnly />
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
                      <input type="date" id="leave-date" name="leave-date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="leave-period">時段</label>
                      <select id="leave-period" name="leave-period" required value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
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
                      <select id="leave-type" name="leave-type" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
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
                      <input type="number" id="leave-days" name="leave-days" min="0.5" max="30" step="0.5" required value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="leave-reason">請假原因</label>
                    <textarea id="leave-reason" name="leave-reason" placeholder="請詳細說明請假原因..." required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}></textarea>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-success" disabled={loading}>{loading ? '送出中...' : '提交申請'}</button>
                    <button type="reset" className="btn btn-secondary" onClick={() => setForm({ date: '', period: '', type: '', days: '', reason: '' })}>重置</button>
                  </div>
                  {submitMsg && <div style={{ color: submitMsg.includes('成功') ? 'green' : 'red', marginTop: 8 }}>{submitMsg}</div>}
                </form>
              </div>
            </div>
          )}
          {/* 請假紀錄頁面 */}
          {tab === 'history' && !loading && (
            <div id="history" className="tab-content">
              <div className="card">
                <h3>請假紀錄</h3>
                <div id="leave-history" className="table-container">
                  {history.length === 0 ? <span>尚無請假紀錄</span> : (
                    <table>
                      <thead>
                        <tr>
                          <th>日期</th>
                          <th>假別</th>
                          <th>時段</th>
                          <th>天數</th>
                          <th>原因</th>
                          <th>狀態</th>
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
                            <td><span className={`status ${h.status}`}>{h.status === 'pending' ? '待審核' : h.status === 'approved' ? '已核准' : h.status}</span></td>
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
    </div>
  );
} 