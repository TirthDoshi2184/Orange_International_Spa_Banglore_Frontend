import * as XLSX from "xlsx";

// Builds and downloads a printable "Membership Visit Log" .xlsx for one member —
// header details up top, then blank Date / Name / Sign rows for reception to fill in by hand
// each time the member visits, so admin can see attendance manually over time.
export const downloadMembershipVisitLog = (membership) => {
  const customer = membership.customerId || {};

  const rows = [
    ["Orange International Spa — Membership Visit Log"],
    [],
    ["Name", customer.name || ""],
    ["Membership No", membership.membershipId || ""],
    ["Phone Number", customer.mobileNumber || ""],
    ["Tier", membership.tier || ""],
    ["Status", membership.status || ""],
    ["Valid Until", membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString("en-IN") : "—"],
    [],
    ["Date", "Name", "Sign"],
  ];

  // 50 blank rows for reception to fill in by hand on future visits
  for (let i = 0; i < 50; i++) {
    rows.push(["", "", ""]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths: Date, Name, Sign
  worksheet["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 22 }];

  // Merge the title across the first 3 columns
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Visit Log");

  const safeName = (customer.name || "member").replace(/[^a-z0-9]+/gi, "_");
  XLSX.writeFile(workbook, `${safeName}_visit_log.xlsx`);
};