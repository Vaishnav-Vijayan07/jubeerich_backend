const IdsFromEnv = require("../constants/ids");

const getWeeklyDateRange = (year, month, day) => {
  const dateFromDay = (dateString) => {
    const day = new Date(dateString).getDate();
    return day;
  };

  const dayModified = dateFromDay(day);
  // Handle edge cases where the month might have different days (28, 29, 30, or 31)
  const lastDayOfMonth = new Date(year, month, 0).getDate(); // Get the last day of the month (28, 29, 30, or 31)

  // Create a Date object with the given year, month, and day
  const startDate = new Date(year, month - 1, dayModified); // Month is 0-indexed

  // Check if the selected day is within the last 7 days of the month
  if (dayModified > lastDayOfMonth - 6) {
    // If the selected day is in the last part of the month, return the range from the selected day to the last day of the month
    const endDate = new Date(year, month - 1, lastDayOfMonth); // End date is the last day of the month

    // Format dates as YYYY-MM-DD

    return {
      startDate: startDate,
      endDate: endDate,
    };
  } else {
    // If the selected date is not near the end of the month, calculate a standard 7-day range
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 7-day range (0th day + 6 more days)

    return {
      startDate: startDate,
      endDate: endDate,
    };
  }
};

function getMonthStartAndEndDates(month, year) {
  // Validate the month input (should be between 1 and 12)
  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  // Get the first day of the month
  const startDate = new Date(year, month - 1, 1); // month is 0-indexed in JavaScript Date
  // Get the last day of the month (set date to 0 for the next month and then get the last day of the previous month)
  const endDate = new Date(year, month, 0);

  // Format dates as YYYY-MM-DD

  return {
    startDate: startDate,
    endDate: endDate,
  };
}

const formatToDbDate = (date) => {
  const formattedDate = new Date(date).toISOString().split("T")[0];
  return formattedDate;
};

const getDateRangeCondition = (filterArgs, type, role_id, user_id, creids = []) => {
  let whereRaw = "";
  let country = null;
  const isApplicationSide = role_id == IdsFromEnv.APPLICATION_MANAGER_ID || role_id ==  IdsFromEnv.APPLICATION_TEAM_ID;

  switch (role_id) {
    case IdsFromEnv.CRE_TL_ID:
      whereRaw = `WHERE rn = 1 
      AND (
        created_by IN (${creids.join(", ")}, ${user_id}) 
        OR assigned_cre_tl = ${user_id}
        OR assigned_cre IN (${creids.join(", ")})
      )`;
      break;
    case IdsFromEnv.CRE_ID:
      whereRaw = `WHERE rn = 1 AND created_by = ${user_id} OR assigned_cre = ${user_id}`;
      break;
    case IdsFromEnv.COUNSELLOR_ROLE_ID:
      whereRaw = `WHERE rn = 1 AND  (created_by = ${user_id} OR counselor_id = ${user_id})`;
      break;
    case IdsFromEnv.COUNTRY_MANAGER_ID:
      whereRaw = `WHERE rn = 1 AND (
        created_by = ${user_id}
        OR EXISTS (
            SELECT 1 
            FROM user_counselors uc2
            WHERE uc2.user_id = user_primary_info_id
            AND uc2.counselor_id = ${user_id}
        )
    )`;
      break;
    case IdsFromEnv.APPLICATION_MANAGER_ID:
      country = filterArgs.country_id;
      whereRaw = `
    WHERE 
        c.id = ${country} AND a.proceed_to_application_manager = true`;
      break;
    case IdsFromEnv.APPLICATION_TEAM_ID:
      whereRaw = `
    WHERE 
      a.proceed_to_application_manager = true AND a.assigned_user = ${user_id}`;
      break;
    default:
      whereRaw = "WHERE rn = 1";
  }

  switch (type) {
    case "monthly":
      // Get the start and end dates for the month
      const { startDate: monthStart, endDate: monthEnd } = getMonthStartAndEndDates(filterArgs.month, filterArgs.year);

      const formattedStartDateMonth = formatToDbDate(monthStart);
      const formattedEndDateMonth = formatToDbDate(monthEnd);
      whereRaw += ` AND ${isApplicationSide ? "a.created_at" : "created_at"} BETWEEN '${formattedStartDateMonth}' AND '${formattedEndDateMonth}'`;
      break;

    case "weekly":
      // Get the start and end dates for the week
      const { startDate: weekStart, endDate: weekEnd } = getWeeklyDateRange(filterArgs.year, filterArgs.month, filterArgs.fromDate);
      const formattedStartDateWeek = formatToDbDate(weekStart);
      const formattedEndDateWeek = formatToDbDate(weekEnd);
      whereRaw += ` AND ${isApplicationSide ? "a.created_at" : "created_at"} BETWEEN '${formattedStartDateWeek}' AND '${formattedEndDateWeek}'`;
      break;

    case "custom":
      // For custom, directly format the provided from and to dates
      const formattedFromDate = formatToDbDate(filterArgs.fromDate);
      const formattedToDate = formatToDbDate(filterArgs.toDate);
      whereRaw += ` AND ${isApplicationSide ? "a.created_at" : "created_at"} BETWEEN '${formattedFromDate}' AND '${formattedToDate}'`;
      break;

    default:
      // Default to the next day from today's date
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = formatToDbDate(tomorrow);
      whereRaw += ` AND ${isApplicationSide ? "a.created_at" : "created_at"} <= '${formattedTomorrow}'`;
      break;
  }

  console.log(whereRaw,isApplicationSide);
  

  return { whereRaw };
};

module.exports = { getWeeklyDateRange, formatToDbDate, getMonthStartAndEndDates, getDateRangeCondition };
