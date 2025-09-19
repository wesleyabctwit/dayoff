import React from "react";
import { EmployeeItem } from "../types";

interface AddEditEmployeeFormProps {
  isEditMode: boolean;
  editingEmployee: EmployeeItem | null;
  loading: boolean;
  error: string;
  addEmployee: (e: React.FormEvent) => Promise<void>;
  handleReset: () => void;
}

const AddEditEmployeeForm: React.FC<AddEditEmployeeFormProps> = ({
  isEditMode,
  editingEmployee,
  loading,
  error,
  addEmployee,
  handleReset,
}) => {
  return (
    <div id="add-employee" className="tab-content">
      <div className="card">
        <h3>{isEditMode ? "編輯員工" : "新增員工"}</h3>
        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
        <form onSubmit={addEmployee}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-employee-name">姓名</label>
              <input
                type="text"
                id="new-employee-name"
                name="name"
                required
                defaultValue={isEditMode ? editingEmployee?.name : ""}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-employee-email">Email</label>
              <input
                type="email"
                id="new-employee-email"
                name="email"
                required
                readOnly={isEditMode}
                className={isEditMode ? "readonly" : ""}
                defaultValue={isEditMode ? editingEmployee?.email : ""}
              />
              {isEditMode && (
                <small className="form-help">Email 不可修改</small>
              )}
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
                defaultValue={isEditMode ? editingEmployee?.password : ""}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-employee-hire-date">到職日</label>
              <input
                type="date"
                id="new-employee-hire-date"
                name="hireDate"
                required
                defaultValue={isEditMode ? editingEmployee?.hireDate : ""}
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
                defaultValue={isEditMode ? editingEmployee?.department : ""}
              >
                <option value="">請選擇部門</option>
                <option value="技術部">技術部</option>
                <option value="行銷部">行銷部</option>
                <option value="人事部">人事部</option>
                <option value="財務部">財務部</option>
              </select>
            </div>
            <div className="form-group">{/* 空白欄位保持對齊 */}</div>
          </div>

          <div className="form-section-two-cols">
            <div className="form-section">
              <h4>剩餘天數</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘特休">剩餘特休</label>
                  <input
                    type="number"
                    id="new-employee-剩餘特休"
                    name="剩餘特休"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘特休 || 0) : 0
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘補休">剩餘補休</label>
                  <input
                    type="number"
                    id="new-employee-剩餘補休"
                    name="剩餘補休"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘補休 || 0) : 0
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘事假">剩餘事假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘事假"
                    name="剩餘事假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘事假 || 0) : 0
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘病假">剩餘病假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘病假"
                    name="剩餘病假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘病假 || 0) : 0
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘喪假">剩餘喪假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘喪假"
                    name="剩餘喪假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘喪假 || 0) : 0
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘育嬰假">剩餘育嬰假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘育嬰假"
                    name="剩餘育嬰假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘育嬰假 || 0) : 0
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘產假">剩餘產假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘產假"
                    name="剩餘產假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘產假 || 0) : 0
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-剩餘婚假">剩餘婚假</label>
                  <input
                    type="number"
                    id="new-employee-剩餘婚假"
                    name="剩餘婚假"
                    min={0}
                    max={365}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.剩餘婚假 || 0) : 0
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>假期天數設定</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-特休">特休天數</label>
                  <input
                    type="number"
                    id="new-employee-特休"
                    name="特休"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.特休 || 0) : 14
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-補休">補休天數</label>
                  <input
                    type="number"
                    id="new-employee-補休"
                    name="補休"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.補休 || 0) : 0
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-事假">事假天數</label>
                  <input
                    type="number"
                    id="new-employee-事假"
                    name="事假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.事假 || 0) : 7
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-病假">病假天數</label>
                  <input
                    type="number"
                    id="new-employee-病假"
                    name="病假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.病假 || 0) : 5
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-喪假">喪假天數</label>
                  <input
                    type="number"
                    id="new-employee-喪假"
                    name="喪假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.喪假 || 0) : 3
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-育嬰假">育嬰假天數</label>
                  <input
                    type="number"
                    id="new-employee-育嬰假"
                    name="育嬰假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.育嬰假 || 0) : 0
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="new-employee-產假">產假天數</label>
                  <input
                    type="number"
                    id="new-employee-產假"
                    name="產假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.產假 || 0) : 0
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-employee-婚假">婚假天數</label>
                  <input
                    type="number"
                    id="new-employee-婚假"
                    name="婚假"
                    min={0}
                    max={30}
                    defaultValue={
                      isEditMode ? Number(editingEmployee?.婚假 || 0) : 3
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-employee-notes">備註</label>
            <textarea
              id="new-employee-notes"
              name="notes"
              placeholder="其他備註事項..."
              defaultValue={isEditMode ? editingEmployee?.notes : ""}
            ></textarea>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              {isEditMode ? "恢復原值" : "清空表單"}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? "更新員工" : "新增員工"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditEmployeeForm;
