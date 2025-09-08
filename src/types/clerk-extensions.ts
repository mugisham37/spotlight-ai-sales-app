// Extended Clerk types for MFA functionality
import {
  DeletedObjectResource,
  EmailAddressResource,
  PhoneNumberResource,
} from "@clerk/types";

// Our custom TOTP Resource interface for type safety
export interface CustomTOTPResource {
  id: string;
  secret?: string;
  uri?: string;
  qrCode?: string;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Add methods that we use in our components
  delete?: () => Promise<DeletedObjectResource>;
  verify?: (options: { code: string }) => Promise<CustomTOTPResource>;
}

// Our custom Backup Code Resource interface
export interface CustomBackupCodeResource {
  id: string;
  codes: string[];
  createdAt?: Date;
  updatedAt?: Date;
  // Add methods that we use
  delete?: () => Promise<DeletedObjectResource>;
}

// Extended User Resource with MFA properties - using composition instead of extension
export interface ExtendedUserResource {
  // Copy relevant properties from UserResource
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses: EmailAddressResource[];
  phoneNumbers: PhoneNumberResource[];
  primaryEmailAddressId?: string | null;
  primaryPhoneNumberId?: string | null;
  totpEnabled?: boolean;
  backupCodeEnabled?: boolean;
  twoFactorEnabled?: boolean;

  // Our custom MFA properties
  totpResource?: CustomTOTPResource | null;
  backupCodeResource?: CustomBackupCodeResource | null;

  // MFA methods
  createTOTP: () => Promise<CustomTOTPResource>;
  createBackupCode: () => Promise<CustomBackupCodeResource>;
  disableTOTP: () => Promise<DeletedObjectResource>;

  // Keep other UserResource methods we might need
  reload: () => Promise<ExtendedUserResource>;
  update: (params: Record<string, unknown>) => Promise<ExtendedUserResource>;
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
