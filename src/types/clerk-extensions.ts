// Extended Clerk types for MFA functionality
import {
  UserResource,
  TOTPResource as ClerkTOTPResource,
  BackupCodeResource as ClerkBackupCodeResource,
} from "@clerk/types";

// Extended TOTP Resource interface that includes Clerk's required properties
export interface TOTPResource extends ClerkTOTPResource {
  secret?: string;
  uri?: string;
  qrCode?: string;
  backupCodes?: string[];
}

// Custom Backup Code Resource interface that extends Clerk's interface
export interface BackupCodeResource extends ClerkBackupCodeResource {
  codes: string[];
}

// Extended User Resource with MFA properties
export interface ExtendedUserResource
  extends Omit<UserResource, "createTOTP" | "createBackupCode"> {
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
      parameters?: Record<string, unknown>
    ) => void;
  }
}
