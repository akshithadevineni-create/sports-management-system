import { isAfter, isBefore, isValid, parseISO, startOfDay } from "date-fns";

export type MembershipStatus = "Active" | "Expired" | "Pending";

export const getMembershipStatus = (
  startDate: string,
  expiryDate: string,
  approvalDate: string | null,
): MembershipStatus => {
  const today = startOfDay(new Date());
  const parsedStartDate = parseISO(startDate);
  const parsedExpiryDate = parseISO(expiryDate);
  const parsedApprovalDate = approvalDate ? parseISO(approvalDate) : null;

  if (!isValid(parsedStartDate) || !isValid(parsedExpiryDate)) {
    return "Pending";
  }

  if (isAfter(today, parsedExpiryDate)) {
    return "Expired";
  }

  if (!parsedApprovalDate || !isValid(parsedApprovalDate)) {
    return "Pending";
  }

  if (!isBefore(today, parsedStartDate) && !isAfter(today, parsedExpiryDate)) {
    return "Active";
  }

  return "Pending";
};
