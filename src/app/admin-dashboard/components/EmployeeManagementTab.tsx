import React from "react";
import { EmployeeItem } from "../types";

interface EmployeeManagementTabProps {
  employees: EmployeeItem[];
  loading: boolean;
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => string;
  handleAddEmployee: () => void;
  handleEditEmployee: (employee: EmployeeItem) => void;
}

const EmployeeManagementTab: React.FC<EmployeeManagementTabProps> = ({
  employees,
  loading,
  handleSort,
  getSortIcon,
  handleAddEmployee,
  handleEditEmployee,
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

  return (
    <div id="employees" className="tab-content">
      <div className="card">
        <div className="card-header">
          <h3>員工列表</h3>
          <button className="btn btn-success" onClick={handleAddEmployee}>
            新增員工
          </button>
        </div>
        <div id="employee-list" className="table-container">
          {employees.length === 0 ? (
            <span>尚無員工資料</span>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>操作</th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("name")}
                  >
                    姓名 {getSortIcon("name")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("email")}
                  >
                    Email {getSortIcon("email")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("hireDate")}
                  >
                    到職日 {getSortIcon("hireDate")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("department")}
                  >
                    部門 {getSortIcon("department")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("特休")}
                  >
                    特休 {getSortIcon("特休")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("補休")}
                  >
                    補休 {getSortIcon("補休")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("事假")}
                  >
                    事假 {getSortIcon("事假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("病假")}
                  >
                    病假 {getSortIcon("病假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("喪假")}
                  >
                    喪假 {getSortIcon("喪假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("育嬰假")}
                  >
                    育嬰假 {getSortIcon("育嬰假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("產假")}
                  >
                    產假 {getSortIcon("產假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("婚假")}
                  >
                    婚假 {getSortIcon("婚假")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("notes")}
                  >
                    備註 {getSortIcon("notes")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: EmployeeItem, i) => (
                  <tr key={i}>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEditEmployee(emp)}
                      >
                        編輯
                      </button>
                    </td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.hireDate}</td>
                    <td>{emp.department}</td>
                    <td>
                      {emp.剩餘特休}/{emp.特休}
                    </td>
                    <td>
                      {emp.剩餘補休}/{emp.補休}
                    </td>
                    <td>
                      {emp.剩餘事假}/{emp.事假}
                    </td>
                    <td>
                      {emp.剩餘病假}/{emp.病假}
                    </td>
                    <td>
                      {emp.剩餘喪假}/{emp.喪假}
                    </td>
                    <td>
                      {emp.剩餘育嬰假}/{emp.育嬰假}
                    </td>
                    <td>
                      {emp.剩餘產假}/{emp.產假}
                    </td>
                    <td>
                      {emp.剩餘婚假}/{emp.婚假}
                    </td>
                    <td>{emp.notes}</td>
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

export default EmployeeManagementTab;
