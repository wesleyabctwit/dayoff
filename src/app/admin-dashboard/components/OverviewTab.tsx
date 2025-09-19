import React from "react";
import { OverviewResponse, OverviewActivity } from "../types";

interface OverviewTabProps {
  overview: OverviewResponse | null;
  loading: boolean;
  error: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  loading,
  error,
}) => {
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

  if (error) {
    return <div style={{ color: "red", marginBottom: 16 }}>{error}</div>;
  }

  if (!overview?.stats) {
    return <div style={{ minHeight: "400px" }}>尚無總覽資料</div>;
  }

  return (
    <div id="overview" className="tab-content">
      <div className="card">
        <h3>當月請假統計</h3>
        <div className="leave-stats-grid">
          <div className="leave-stat-item">
            <span className="leave-type">特休</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.特休} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">補休</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.補休} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">事假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.事假} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">病假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.病假} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">喪假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.喪假} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">育嬰假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.育嬰假} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">產假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.產假} 次
            </span>
          </div>
          <div className="leave-stat-item">
            <span className="leave-type">婚假</span>
            <span className="leave-count">
              {overview.stats.monthlyLeaveStats.婚假} 次
            </span>
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
              {overview.activities.map((a: OverviewActivity, i: number) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
