import { NextResponse } from "next/server";
import {
  readOvertimeActivities,
  addOvertimeActivity,
  updateOvertimeActivity,
  deleteOvertimeActivity,
  getOvertimeActivityById,
  addCompensatoryHoursToEmployees,
  subtractCompensatoryHoursFromEmployees,
  readEmployees,
  OvertimeActivityRow,
} from "@/lib/sheets";

// GET - 取得所有活動加班記錄
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");

    const activities = await readOvertimeActivities();
    const employees = await readEmployees();

    // 將參與員工 email 轉換為姓名顯示
    let list = activities;

    // 年月篩選
    if (year && month) {
      const prefix = `${year}-${month.padStart(2, "0")}`;
      list = list.filter((a) => (a.date || "").startsWith(prefix));
    } else if (year) {
      list = list.filter((a) => (a.date || "").startsWith(year));
    }

    const activitiesWithNames = list.map((activity) => {
      const participantEmails = activity.participants
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const participantNames = participantEmails.map((email) => {
        const employee = employees.find((emp) => emp.email === email);
        return employee ? employee.name : email;
      });

      return {
        ...activity,
        participantNames: participantNames.join(", "),
        participantEmails: participantEmails,
      };
    });

    return NextResponse.json(activitiesWithNames);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST - 新增活動加班記錄
export async function POST(request: Request) {
  try {
    const { name, date, hours, participants, description } =
      await request.json();

    if (!name || !date || !hours || !participants) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    const participantEmails = Array.isArray(participants)
      ? participants
      : participants
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean);

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return NextResponse.json(
        { success: false, message: "補休天數必須為正數" },
        { status: 400 }
      );
    }

    // 新增活動記錄
    const newActivity = await addOvertimeActivity({
      name,
      date,
      hours: String(hoursNum),
      participants: participantEmails.join(","),
      description: description || "",
    });

    // 為參與員工增加剩餘補休天數
    await addCompensatoryHoursToEmployees(participantEmails, hoursNum);

    return NextResponse.json({
      success: true,
      message: "活動加班記錄新增成功",
      activity: newActivity,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

// PUT - 更新活動加班記錄
export async function PUT(request: Request) {
  try {
    const { id, name, date, hours, participants, description } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "缺少活動 ID" },
        { status: 400 }
      );
    }

    // 取得舊記錄
    const oldActivity = await getOvertimeActivityById(String(id));
    if (!oldActivity) {
      return NextResponse.json(
        { success: false, message: "找不到該活動記錄" },
        { status: 404 }
      );
    }

    const newParticipantEmails = Array.isArray(participants)
      ? participants
      : participants
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean);
    const oldParticipantEmails = oldActivity.participants
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const newHours = parseFloat(hours);
    const oldHours = parseFloat(oldActivity.hours);

    if (isNaN(newHours) || newHours <= 0) {
      return NextResponse.json(
        { success: false, message: "補休天數必須為正數" },
        { status: 400 }
      );
    }

    // 先從舊參與員工扣回舊時數
    if (oldParticipantEmails.length > 0 && oldHours > 0) {
      await subtractCompensatoryHoursFromEmployees(
        oldParticipantEmails,
        oldHours
      );
    }

    // 更新活動記錄
    const updatedActivity = await updateOvertimeActivity(String(id), {
      name,
      date,
      hours: String(newHours),
      participants: newParticipantEmails.join(","),
      description: description || "",
    });

    // 為新參與員工增加新時數
    if (newParticipantEmails.length > 0 && newHours > 0) {
      await addCompensatoryHoursToEmployees(newParticipantEmails, newHours);
    }

    return NextResponse.json({
      success: true,
      message: "活動加班記錄更新成功",
      activity: updatedActivity,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

// DELETE - 刪除活動加班記錄
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "缺少活動 ID" },
        { status: 400 }
      );
    }

    // 取得要刪除的記錄
    const activity = await getOvertimeActivityById(id);
    if (!activity) {
      return NextResponse.json(
        { success: false, message: "找不到該活動記錄" },
        { status: 404 }
      );
    }

    const participantEmails = activity.participants
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const hours = parseFloat(activity.hours);

    // 從參與員工扣回補休天數
    if (participantEmails.length > 0 && hours > 0) {
      await subtractCompensatoryHoursFromEmployees(participantEmails, hours);
    }

    // 刪除活動記錄
    const deleted = await deleteOvertimeActivity(id);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "活動加班記錄刪除成功",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "刪除失敗" },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
