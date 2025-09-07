// Extended Navigator interface for experimental APIs
declare global {
  interface Navigator {
    connection?: {
      effectiveType: string;
      downlink: number;
    };
    mozConnection?: {
      effectiveType: string;
      downlink: number;
    };
    webkitConnection?: {
      effectiveType: string;
      downlink: number;
    };
  }
}

export {};
