# DayOff 請假管理系統

一個基於 Next.js 和 Google Sheets 的員工請假管理系統。

## 功能特色

- 📊 員工請假申請與審核
- 👥 員工管理（新增、查看）
- 📅 假期餘額追蹤
- 🔐 安全的登入系統
- 📱 響應式設計

## 系統架構

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes
- **資料庫**: Google Sheets
- **認證**: 自建帳號密碼系統

## 安裝與設定

### 1. 環境變數設定

建立 `.env.local` 檔案：

```bash
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key"
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 初始化 Google Sheets

執行初始化腳本來建立必要的資料表結構：

```bash
npm run init-sheets
```

這會建立以下資料表：

- `employees`: 員工基本資料（包含密碼）
- `leave_requests`: 請假申請紀錄

## 登入系統

### 預設帳號

系統提供以下預設帳號：

#### 管理員帳號

- **Email**: `wesleyabctw.it@gmail.com`
- **密碼**: `admin1234`
- **權限**: 完整管理權限

#### 員工帳號

- **張小明**: `ming@company.com` / `12341234`
- **李小華**: `jackbigapple@gmail.com` / `12341234`

### 新增員工

管理員可以透過管理員儀表板新增員工，系統會自動為新員工建立帳號密碼。

## 開發

```bash
# 開發模式
npm run dev

# 建置
npm run build

# 啟動生產版本
npm start
```

## 資料表結構

### employees 資料表

| 欄位              | 說明         | 範例             |
| ----------------- | ------------ | ---------------- |
| id                | 員工編號     | 1                |
| name              | 姓名         | 張小明           |
| email             | 電子郵件     | ming@company.com |
| password          | 登入密碼     | 123456           |
| hireDate          | 到職日期     | 2023-01-15       |
| department        | 部門         | 技術部           |
| annualLeave       | 特休剩餘天數 | 14               |
| compensatoryLeave | 補休剩餘天數 | 3                |
| sickLeave         | 病假剩餘天數 | 5                |
| notes             | 備註         |                  |

### leave_requests 資料表

| 欄位           | 說明     | 範例                      |
| -------------- | -------- | ------------------------- |
| id             | 申請編號 | 1                         |
| employee_email | 員工郵件 | ming@company.com          |
| date           | 請假日期 | 2024-01-10                |
| period         | 請假時段 | 全天/上午/下午            |
| type           | 假別     | 特休/補休/事假/病假       |
| days           | 請假天數 | 1                         |
| reason         | 請假原因 | 家中有事                  |
| status         | 審核狀態 | pending/approved/rejected |
| created_at     | 申請時間 | 2024-01-10T10:00:00Z      |

## 安全性注意事項

1. **密碼儲存**: 目前密碼以明文儲存在 Google Sheets 中，建議未來實作密碼雜湊
2. **環境變數**: 確保 `.env.local` 檔案不會被提交到版本控制
3. **Google Sheets 權限**: 限制服務帳號的存取權限

## 未來改進

- [ ] 密碼雜湊與加密
- [ ] JWT Token 認證
- [ ] 密碼重設功能
- [ ] 登入嘗試限制
- [ ] 雙因素認證
- [ ] 員工自助密碼修改
