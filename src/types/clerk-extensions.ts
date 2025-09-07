// Extended Clerk types for MFA functionality
import { UserResource } from "@clerk/types";

// TOTP Resource interface
export interface TOTPResource {
  id: string;
  secret?: string;
  uri?: string;
  qrCode?: string;
  verified: boolean;
  backupCodes?: string[];
  createdAt: number;
  updatedAt: number;
  attemptVerification: (params: { code: string }) => Promise<TOTPResource>;
  destroy: () => Promise<void>;
}

// Backup Code Resource interface
export interface BackupCodeResource {
  id: string;
  codes: string[];
  createdAt: number;
  updatedAt: number;
  destroy: () => Promise<void>;
}

// Extended User Resource with MFA properties
export interface ExtendedUserResource extends UserResource {
  totpResource?: TOTPResource | null;
  backupCodeResource?: BackupCodeResource | null;
  createTOTP: () => Promise<TOTPResource>;
  createBackupCode: () => Promise<BackupCodeResource>;
}

// MFA Device interface for our components
export interface MFADevice {
  id: string;
  name: string;
  type: "totp" | "backup_code";
  createdAt: Date;
  lastUsed?: Date;
  location?: string;
  isActive: boolean;
}

// MFA Status interface
export interface MFAStatus {
  enabled: boolean;
  enabledAt?: Date;
  lastUsedAt?: Date;
  hasBackupCodes: boolean;
  deviceCount: number;
}

// MFA Error types
export interface MFAError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  type?: string;
  severity?: string;
  requestId?: string;
  recovery?: {
    action: string;
    url?: string;
    message: string;
  };
}

// Extend the global window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters?: Record<string, any>
    ) => void;
  }
}
