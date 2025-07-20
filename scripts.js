// 登入頁面功能
function switchTab(tab) {
    // 移除所有活動狀態
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(form => form.style.display = 'none');
    
    // 設置活動狀態
    if (tab === 'employee') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('employee-login').style.display = 'block';
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('admin-login').style.display = 'block';
    }
}

function handleEmployeeLogin(event) {
    event.preventDefault();
    const email = document.getElementById('employee-email').value;
    const password = document.getElementById('employee-password').value;
    
    // 模擬登入驗證
    if (email && password) {
        // 儲存用戶資訊到 localStorage
        localStorage.setItem('userType', 'employee');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', email.split('@')[0]);
        
        // 導向員工儀表板
        window.location.href = 'employee-dashboard.html';
    } else {
        alert('請輸入有效的 Email 和密碼');
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    // 模擬管理員登入驗證
    if (email && password) {
        // 儲存管理員資訊到 localStorage
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', '管理員');
        
        // 導向管理員儀表板
        window.location.href = 'admin-dashboard.html';
    } else {
        alert('請輸入有效的管理員 Email 和密碼');
    }
}

// 通用功能
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function checkAuth() {
    const userType = localStorage.getItem('userType');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userType || !userEmail) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

function getUserInfo() {
    return {
        type: localStorage.getItem('userType'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName')
    };
}

// 頁面載入時檢查認證
document.addEventListener('DOMContentLoaded', function() {
    // 如果不是登入頁面，檢查認證
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.includes('/') && 
        window.location.pathname !== '/') {
        checkAuth();
    }
});

// 模擬資料
const mockLeaveData = {
    employee: {
        name: '張小明',
        email: 'ming@company.com',
        hireDate: '2023-01-15',
        leaveBalance: {
            annual: 14,
            compensatory: 3,
            sick: 30,
            personal: 7
        },
        leaveHistory: [
            {
                id: 1,
                date: '2024-01-15',
                period: '全天',
                type: '特休',
                status: '已核准',
                reason: '個人事務'
            },
            {
                id: 2,
                date: '2024-01-20',
                period: '上午',
                type: '病假',
                status: '已核准',
                reason: '感冒'
            }
        ]
    }
};

const mockAdminData = {
    employees: [
        {
            id: 1,
            name: '張小明',
            email: 'ming@company.com',
            hireDate: '2023-01-15',
            annualLeave: 14,
            compensatoryLeave: 3
        },
        {
            id: 2,
            name: '李小華',
            email: 'hua@company.com',
            hireDate: '2023-03-20',
            annualLeave: 12,
            compensatoryLeave: 1
        }
    ],
    pendingRequests: [
        {
            id: 1,
            employeeName: '張小明',
            date: '2024-02-01',
            period: '全天',
            type: '特休',
            reason: '家庭旅遊'
        },
        {
            id: 2,
            employeeName: '李小華',
            date: '2024-02-05',
            period: '下午',
            type: '事假',
            reason: '看醫生'
        }
    ]
};

// 員工儀表板功能
function loadEmployeeDashboard() {
    const userInfo = getUserInfo();
    
    // 更新頁面標題
    document.getElementById('user-name').textContent = userInfo.name;
    
    // 載入假期餘額
    loadLeaveBalance();
    
    // 載入請假紀錄
    loadLeaveHistory();
}

function loadLeaveBalance() {
    const balanceContainer = document.getElementById('leave-balance');
    if (!balanceContainer) return;
    
    const balance = mockLeaveData.employee.leaveBalance;
    
    balanceContainer.innerHTML = `
        <div class="balance-item">
            <h4>特休</h4>
            <div class="amount">${balance.annual}</div>
            <div>天</div>
        </div>
        <div class="balance-item">
            <h4>補休</h4>
            <div class="amount">${balance.compensatory}</div>
            <div>天</div>
        </div>
        <div class="balance-item">
            <h4>病假</h4>
            <div class="amount">${balance.sick}</div>
            <div>天</div>
        </div>
        <div class="balance-item">
            <h4>事假</h4>
            <div class="amount">${balance.personal}</div>
            <div>天</div>
        </div>
    `;
}

function loadLeaveHistory() {
    const historyContainer = document.getElementById('leave-history');
    if (!historyContainer) return;
    
    const history = mockLeaveData.employee.leaveHistory;
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>申請日期</th>
                    <th>時段</th>
                    <th>假別</th>
                    <th>狀態</th>
                    <th>原因</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    history.forEach(record => {
        const statusClass = record.status === '已核准' ? 'approved' : 
                           record.status === '待審核' ? 'pending' : 'rejected';
        
        tableHTML += `
            <tr>
                <td>${record.date}</td>
                <td>${record.period}</td>
                <td>${record.type}</td>
                <td><span class="status ${statusClass}">${record.status}</span></td>
                <td>${record.reason}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    historyContainer.innerHTML = tableHTML;
}

// 管理員儀表板功能
function loadAdminDashboard() {
    const userInfo = getUserInfo();
    
    // 更新頁面標題
    document.getElementById('user-name').textContent = userInfo.name;
    
    // 載入員工列表
    loadEmployeeList();
    
    // 載入待審核申請
    loadPendingRequests();
}

function loadEmployeeList() {
    const employeeContainer = document.getElementById('employee-list');
    if (!employeeContainer) return;
    
    const employees = mockAdminData.employees;
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>姓名</th>
                    <th>Email</th>
                    <th>到職日</th>
                    <th>特休天數</th>
                    <th>補休天數</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    employees.forEach(employee => {
        tableHTML += `
            <tr>
                <td>${employee.name}</td>
                <td>${employee.email}</td>
                <td>${employee.hireDate}</td>
                <td>${employee.annualLeave}</td>
                <td>${employee.compensatoryLeave}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editEmployee(${employee.id})">編輯</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    employeeContainer.innerHTML = tableHTML;
}

function loadPendingRequests() {
    const requestsContainer = document.getElementById('pending-requests');
    if (!requestsContainer) return;
    
    const requests = mockAdminData.pendingRequests;
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>員工姓名</th>
                    <th>請假日期</th>
                    <th>時段</th>
                    <th>假別</th>
                    <th>原因</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    requests.forEach(request => {
        tableHTML += `
            <tr>
                <td>${request.employeeName}</td>
                <td>${request.date}</td>
                <td>${request.period}</td>
                <td>${request.type}</td>
                <td>${request.reason}</td>
                <td>
                    <button class="btn btn-success" onclick="approveRequest(${request.id})">核准</button>
                    <button class="btn btn-danger" onclick="rejectRequest(${request.id})">拒絕</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    requestsContainer.innerHTML = tableHTML;
}

// 請假申請功能
function submitLeaveRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const requestData = {
        date: formData.get('leave-date'),
        period: formData.get('leave-period'),
        type: formData.get('leave-type'),
        reason: formData.get('leave-reason')
    };
    
    // 模擬提交申請
    alert('請假申請已提交，等待管理員審核');
    
    // 重置表單
    event.target.reset();
}

// 管理員操作功能
function editEmployee(employeeId) {
    alert(`編輯員工 ID: ${employeeId} 的資料`);
}

function approveRequest(requestId) {
    if (confirm('確定要核准這個請假申請嗎？')) {
        alert(`已核准申請 ID: ${requestId}`);
        // 重新載入待審核列表
        loadPendingRequests();
    }
}

function rejectRequest(requestId) {
    if (confirm('確定要拒絕這個請假申請嗎？')) {
        alert(`已拒絕申請 ID: ${requestId}`);
        // 重新載入待審核列表
        loadPendingRequests();
    }
}

// 頁面導航功能
function showTab(tabName) {
    // 隱藏所有內容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 移除所有活動狀態
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 顯示選中的內容
    document.getElementById(tabName).style.display = 'block';
    
    // 設置活動狀態
    event.target.classList.add('active');
} 