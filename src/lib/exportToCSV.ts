export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columnMap: Record<string, string>,
): void {
  const keys = Object.keys(columnMap);
  const headers = Object.values(columnMap);

  const escapeValue = (value: unknown) => {
    const stringValue = value === null || value === undefined ? "" : String(value);

    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes("\"")) {
      return `"${stringValue.replace(/"/g, "\"\"")}"`;
    }

    return stringValue;
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...data.map((row) => keys.map((key) => escapeValue(row[key])).join(",")),
  ];
  const csvContent = csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
