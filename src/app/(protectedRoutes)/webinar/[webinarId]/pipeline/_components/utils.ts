import { AttendedTypeEnum } from "@/lib/types";

export const formatColumnTitle = (columnType: AttendedTypeEnum): string => {
  return columnType
    .split("_")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};

export const getColumnColor = (columnType: AttendedTypeEnum): string => {
  const colorMap: Record<AttendedTypeEnum, string> = {
    [AttendedTypeEnum.REGISTERED]: "bg-blue-50 border-blue-200",
    [AttendedTypeEnum.ATTENDED]: "bg-green-50 border-green-200",
    [AttendedTypeEnum.ADDED_TO_CART]: "bg-yellow-50 border-yellow-200",
    [AttendedTypeEnum.FOLLOW_UP]: "bg-purple-50 border-purple-200",
    [AttendedTypeEnum.BREAKOUT_ROOM]: "bg-indigo-50 border-indigo-200",
    [AttendedTypeEnum.CONVERTED]: "bg-emerald-50 border-emerald-200",
  };

  return colorMap[columnType] || "bg-gray-50 border-gray-200";
};
