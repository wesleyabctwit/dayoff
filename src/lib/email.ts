import { Resend } from "resend";
import { LeaveRequestRow, EmployeeRow } from "./sheets";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "";

// 格式化假單詳細資訊
function formatLeaveDetails(
  request: LeaveRequestRow,
  employee: EmployeeRow
): string {
  return `
    <h3>假單詳細資訊</h3>
    <ul>
      <li><strong>員工姓名:</strong> ${employee.name}</li>
      <li><strong>員工 Email:</strong> ${request.employee_email}</li>
      <li><strong>請假日期:</strong> ${request.date}</li>
      <li><strong>時段:</strong> ${request.period}</li>
      <li><strong>假別:</strong> ${request.type}</li>
      <li><strong>天數:</strong> ${request.days}</li>
      <li><strong>事由:</strong> ${request.reason}</li>
      <li><strong>狀態:</strong> ${request.status}</li>
    </ul>
  `;
}

// 寄送新假單申請通知
export async function sendLeaveRequestEmail(
  request: LeaveRequestRow,
  employee: EmployeeRow
) {
  const subject = `[新假單申請] ${employee.name} 的 ${request.type} 申請`;
  const body = `
    <h1>新的請假單已提交</h1>
    <p>${employee.name} 已提交一份新的請假申請。</p>
    ${formatLeaveDetails(request, employee)}
  `;

  try {
    // 寄給管理員
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: subject,
      html: body,
    });

    // 寄給員工本人
    await resend.emails.send({
      from: FROM_EMAIL,
      to: request.employee_email,
      subject: `您的請假申請已提交`,
      html: `
        <h1>您的請假申請已成功提交</h1>
        <p>您的 ${request.type} 申請已成功提交，正在等待管理員審核。</p>
        ${formatLeaveDetails(request, employee)}
      `,
    });
  } catch (error) {
    console.error("郵件發送失敗:", error);
    throw new Error("郵件發送失敗");
  }
}

// 寄送假單狀態更新通知
export async function sendLeaveStatusUpdateEmail(
  request: LeaveRequestRow,
  employee: EmployeeRow
) {
  const statusMap: { [key: string]: string } = {
    approved: "已核准",
    rejected: "已拒絕",
  };
  const statusText = statusMap[request.status] || request.status;
  const subject = `[假單狀態更新] 您的 ${request.type} 申請已${statusText}`;
  const body = `
    <h1>您的假單狀態已更新</h1>
    <p>您於 ${request.date} 提交的 ${
    request.type
  } 申請，狀態已更新為 <strong>${statusText}</strong>。</p>
    ${formatLeaveDetails(request, employee)}
  `;

  try {
    // 寄給員工本人
    await resend.emails.send({
      from: FROM_EMAIL,
      to: request.employee_email,
      subject: subject,
      html: body,
    });

    // 寄給管理員 (可選，如果管理員也需要收到狀態變更通知)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[假單狀態更新] ${employee.name} 的 ${request.type} 申請已${statusText}`,
      html: `
        <h1>假單狀態已由您更新</h1>
        <p>${employee.name} 的 ${
        request.type
      } 申請狀態已更新為 <strong>${statusText}</strong>。</p>
        ${formatLeaveDetails(request, employee)}
      `,
    });
  } catch (error) {
    console.error("郵件發送失敗:", error);
    throw new Error("郵件發送失敗");
  }
}
