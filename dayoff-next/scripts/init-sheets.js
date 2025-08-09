// 初始化 Google Sheets 資料表腳本
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function initSheets() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const SERVICE_ACCOUNT_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.error('缺少 Google Sheets 憑證。請檢查 .env.local');
    process.exit(1);
  }

  const auth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();

  console.log(`正在初始化試算表: ${doc.title}`);

  // 建立或更新 employees 分頁
  let employeesSheet = doc.sheetsByTitle['employees'];
  if (!employeesSheet) {
    employeesSheet = await doc.addSheet({
      title: 'employees',
      headerValues: ['id', 'name', 'email', 'hireDate', 'department', 'annualLeave', 'compensatoryLeave', 'sickLeave', 'notes']
    });
  } else {
    // 清除現有內容並設定表頭
    await employeesSheet.clear();
    await employeesSheet.setHeaderRow(['id', 'name', 'email', 'hireDate', 'department', 'annualLeave', 'compensatoryLeave', 'sickLeave', 'notes']);
  }

  // 新增示例員工資料
  await employeesSheet.addRows([
    {
      id: '1',
      name: '張小明',
      email: 'ming@company.com',
      hireDate: '2023-01-15',
      department: '技術部',
      annualLeave: '14',
      compensatoryLeave: '3',
      sickLeave: '5',
      notes: ''
    },
    {
      id: '2',
      name: '李小華',
      email: 'hua@company.com',
      hireDate: '2022-08-01',
      department: '行銷部',
      annualLeave: '10',
      compensatoryLeave: '0',
      sickLeave: '6',
      notes: '兼職'
    }
  ]);

  console.log('✓ employees 分頁已建立並填入示例資料');

  // 建立或更新 leave_requests 分頁
  let leaveRequestsSheet = doc.sheetsByTitle['leave_requests'];
  if (!leaveRequestsSheet) {
    leaveRequestsSheet = await doc.addSheet({
      title: 'leave_requests',
      headerValues: ['id', 'employee_email', 'date', 'period', 'type', 'days', 'reason', 'status', 'created_at']
    });
  } else {
    // 清除現有內容並設定表頭
    await leaveRequestsSheet.clear();
    await leaveRequestsSheet.setHeaderRow(['id', 'employee_email', 'date', 'period', 'type', 'days', 'reason', 'status', 'created_at']);
  }

  // 新增示例請假資料
  await leaveRequestsSheet.addRows([
    {
      id: '1',
      employee_email: 'ming@company.com',
      date: '2024-01-10',
      period: '全天',
      type: '特休',
      days: '1',
      reason: '家中有事',
      status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      employee_email: 'hua@company.com',
      date: '2024-01-20',
      period: '上午',
      type: '病假',
      days: '0.5',
      reason: '感冒',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ]);

  console.log('✓ leave_requests 分頁已建立並填入示例資料');

  // 刪除不需要的分頁
  const sheetsToDelete = ['overview', 'leave_request']; // 注意：leave_request 少了 s
  for (const sheetTitle of sheetsToDelete) {
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (sheet) {
      await sheet.delete();
      console.log(`✓ 已刪除不需要的分頁: ${sheetTitle}`);
    }
  }

  console.log('\n🎉 Google Sheets 初始化完成！');
  console.log('資料表結構：');
  console.log('- employees: 員工基本資料與假期餘額');
  console.log('- leave_requests: 請假申請紀錄');
}

initSheets().catch(console.error);
