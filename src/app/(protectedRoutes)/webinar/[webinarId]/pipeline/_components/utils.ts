export const formatColumnTitle = (columnType: AttendedTypeEnum): string => {
  return columnType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
