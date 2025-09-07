// Audit trail system for authentication and authorization events
import { structuredLogger } from "./structured-logger";
import type { BaseMetadata } from "./types";

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_SIGN_IN = "user_sign_in",
  USER_SIGN_OUT = "user_sign_out",
  USER_SIGN_UP = "user_sign_up",
  PASSWORD_RESET = "password_reset",
  PASSWORD_CHANGE = "password_change",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  MFA_VERIFIED = "mfa_verified",
  SESSION_CREATED = "session_created",
  SESSION_EXPIRED = "session_expired",
  SESSION_TERMINATED = "session_terminated",

  // Authorization events
  PERMISSION_GRANTED = "permission_granted",
  PERMISSION_DENIED = "permission_denied",
  ROLE_ASSIGNED = "role_assigned",
  ROLE_REMOVED = "role_removed",
  PRIVILEGE_ESCALATION_ATTEMPT = "privilege_escalation_attempt",
  UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt",

  // Account management events
  ACCOUNT_CREATED = "account_created",
  ACCOUNT_UPDATED = "account_updated",
  ACCOUNT_DELETED = "account_deleted",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  ACCOUNT_SUSPENDED = "account_suspended",
  ACCOUNT_REACTIVATED = "account_reactivated",

  // Data access events
  SENSITIVE_DATA_ACCESSED = "sensitive_data_accessed",
  DATA_EXPORTED = "data_exported",
  DATA_MODIFIED = "data_modified",
  DATA_DELETED = "data_deleted",

  // System events
  CONFIGURATION_CHANGED = "configuration_changed",
  SECURITY_POLICY_UPDATED = "security_policy_updated",
  BACKUP_CREATED = "backup_created",
  BACKUP_RESTORED = "backup_restored",

  // Webhook events
  WEBHOOK_RECEIVED = "webhook_received",
  WEBHOOK_PROCESSED = "webhook_processed",
  WEBHOOK_FAILED = "webhook_failed",
}

export enum AuditResult {
  SUCCESS = "success",
  FAILURE = "failure",
  PARTIAL = "partial",
  BLOCKED = "blocked",
}

export enum AuditSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Audit event interface
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  result: AuditResult;
  severity: AuditSeverity;
  timestamp: Date;
  requestId: string;
  sessionId?: string;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  resource?: string;
  action: string;
  description: string;
  details: BaseMetadata;
  metadata: {
    source: string;
    version: string;
    environment: string;
    correlationId?: string;
    parentEventId?: string;
  };
  compliance: {
    gdpr?: boolean;
    hipaa?: boolean;
    sox?: boolean;
    pci?: boolean;
  };
}

// Audit trail class
export class AuditTrail {
  private static events: AuditEvent[] = [];
  private static readonly MAX_EVENTS = 100000;
  private static readonly EVENT_RETENTION_DAYS = 90; // 90 days for compliance
  private static readonly ENVIRONMENT = process.env.NODE_ENV || "development";
  private static readonly VERSION = process.env.APP_VERSION || "1.0.0";

  // Log audit event
  static logEvent(
    type: AuditEventType,
    result: AuditResult,
    action: string,
    description: string,
    details: Record<
      string,
      string | number | boolean | Date | null | undefined
    > = {},
    context: {
      requestId: string;
      userId?: string;
      email?: string;
      ip?: string;
      userAgent?: string;
      sessionId?: string;
      resource?: string;
      correlationId?: string;
      parentEventId?: string;
    }
  ): AuditEvent {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      type,
      result,
      severity: this.determineSeverity(type, result),
      timestamp: new Date(),
      requestId: context.requestId,
      sessionId: context.sessionId,
      userId: context.userId,
      email: context.email,
      ip: context.ip || "unknown",
      userAgent: context.userAgent || "unknown",
      resource: context.resource,
      action,
      description,
      details,
      metadata: {
        source: "auth-system",
        version: this.VERSION,
        environment: this.ENVIRONMENT,
        correlationId: context.correlationId,
        parentEventId: context.parentEventId,
      },
      compliance: this.determineComplianceFlags(type, details),
    };

    this.addEvent(event);
    this.logToStructuredLogger(event);
    this.processComplianceRequirements(event);

    return event;
  }

  // Authentication audit methods
  static logSignIn(
    userId: string,
    email: string,
    success: boolean,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      sessionId?: string;
      method?: string;
      mfaUsed?: boolean;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.USER_SIGN_IN,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      "authenticate",
      success ? "User signed in successfully" : "User sign-in failed",
      {
        method: context.method || "password",
        mfaUsed: context.mfaUsed || false,
        sessionDuration: success ? "active" : "none",
      },
      {
        requestId: context.requestId,
        userId: success ? userId : undefined,
        email,
        ip: context.ip,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        resource: "authentication",
      }
    );
  }

  static logSignOut(
    userId: string,
    email: string,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      sessionId: string;
      reason?: string;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.USER_SIGN_OUT,
      AuditResult.SUCCESS,
      "sign_out",
      "User signed out",
      {
        reason: context.reason || "user_initiated",
        sessionDuration: "ended",
      },
      {
        requestId: context.requestId,
        userId,
        email,
        ip: context.ip,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        resource: "authentication",
      }
    );
  }

  static logSignUp(
    userId: string,
    email: string,
    success: boolean,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      verificationMethod?: string;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.USER_SIGN_UP,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      "register",
      success
        ? "User account created successfully"
        : "User account creation failed",
      {
        verificationMethod: context.verificationMethod || "email",
        accountStatus: success ? "active" : "failed",
      },
      {
        requestId: context.requestId,
        userId: success ? userId : undefined,
        email,
        ip: context.ip,
        userAgent: context.userAgent,
        resource: "user_account",
      }
    );
  }

  // Authorization audit methods
  static logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      role?: string;
      permissions?: string[];
      reason?: string;
    }
  ): AuditEvent {
    return this.logEvent(
      granted
        ? AuditEventType.PERMISSION_GRANTED
        : AuditEventType.PERMISSION_DENIED,
      granted ? AuditResult.SUCCESS : AuditResult.BLOCKED,
      action,
      granted
        ? `Permission granted for ${action} on ${resource}`
        : `Permission denied for ${action} on ${resource}`,
      {
        role: context.role,
        permissionsCount: context.permissions?.length || 0,
        reason: context.reason,
        resourceType: this.extractResourceType(resource),
      },
      {
        requestId: context.requestId,
        userId,
        ip: context.ip,
        userAgent: context.userAgent,
        resource,
      }
    );
  }

  static logRoleChange(
    targetUserId: string,
    targetEmail: string,
    oldRole: string,
    newRole: string,
    adminUserId: string,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      reason?: string;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.ROLE_ASSIGNED,
      AuditResult.SUCCESS,
      "role_change",
      `User role changed from ${oldRole} to ${newRole}`,
      {
        targetUserId,
        targetEmail,
        oldRole,
        newRole,
        adminUserId,
        reason: context.reason,
      },
      {
        requestId: context.requestId,
        userId: adminUserId,
        ip: context.ip,
        userAgent: context.userAgent,
        resource: "user_role",
      }
    );
  }

  // Data access audit methods
  static logDataAccess(
    userId: string,
    resource: string,
    action: string,
    success: boolean,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      dataType?: string;
      recordCount?: number;
      sensitiveData?: boolean;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.SENSITIVE_DATA_ACCESSED,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      action,
      `Data ${action} ${success ? "successful" : "failed"} for ${resource}`,
      {
        dataType: context.dataType,
        recordCount: context.recordCount,
        sensitiveData: context.sensitiveData || false,
        accessPattern: this.determineAccessPattern(action),
      },
      {
        requestId: context.requestId,
        userId,
        ip: context.ip,
        userAgent: context.userAgent,
        resource,
      }
    );
  }

  // Webhook audit methods
  static logWebhookEvent(
    eventType: string,
    success: boolean,
    context: {
      requestId: string;
      ip: string;
      userAgent: string;
      webhookId?: string;
      eventId?: string;
      processingTime?: number;
      retryCount?: number;
    }
  ): AuditEvent {
    return this.logEvent(
      success
        ? AuditEventType.WEBHOOK_PROCESSED
        : AuditEventType.WEBHOOK_FAILED,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      "webhook_process",
      `Webhook ${eventType} ${
        success ? "processed successfully" : "processing failed"
      }`,
      {
        eventType,
        webhookId: context.webhookId,
        eventId: context.eventId,
        processingTime: context.processingTime,
        retryCount: context.retryCount || 0,
      },
      {
        requestId: context.requestId,
        ip: context.ip,
        userAgent: context.userAgent,
        resource: "webhook",
      }
    );
  }

  // Security event audit methods
  static logSecurityEvent(
    eventType: string,
    severity: AuditSeverity,
    description: string,
    context: {
      requestId: string;
      userId?: string;
      ip: string;
      userAgent: string;
      blocked?: boolean;
      riskScore?: number;
      details?: Record<
        string,
        string | number | boolean | Date | null | undefined
      >;
    }
  ): AuditEvent {
    return this.logEvent(
      AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      context.blocked ? AuditResult.BLOCKED : AuditResult.FAILURE,
      "security_event",
      description,
      {
        eventType,
        riskScore: context.riskScore,
        blocked: context.blocked || false,
        ...context.details,
      },
      {
        requestId: context.requestId,
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
        resource: "security",
      }
    );
  }

  // Helper methods
  private static determineSeverity(
    type: AuditEventType,
    result: AuditResult
  ): AuditSeverity {
    // Critical events
    const criticalEvents = [
      AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT,
      AuditEventType.ACCOUNT_DELETED,
      AuditEventType.SENSITIVE_DATA_ACCESSED,
      AuditEventType.DATA_DELETED,
      AuditEventType.CONFIGURATION_CHANGED,
    ];

    if (criticalEvents.includes(type)) {
      return AuditSeverity.CRITICAL;
    }

    // High severity events
    const highSeverityEvents = [
      AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      AuditEventType.ACCOUNT_LOCKED,
      AuditEventType.ROLE_ASSIGNED,
      AuditEventType.ROLE_REMOVED,
      AuditEventType.DATA_MODIFIED,
    ];

    if (highSeverityEvents.includes(type) || result === AuditResult.BLOCKED) {
      return AuditSeverity.HIGH;
    }

    // Medium severity events
    const mediumSeverityEvents = [
      AuditEventType.PERMISSION_DENIED,
      AuditEventType.ACCOUNT_UPDATED,
      AuditEventType.PASSWORD_CHANGE,
      AuditEventType.MFA_ENABLED,
      AuditEventType.MFA_DISABLED,
    ];

    if (mediumSeverityEvents.includes(type) || result === AuditResult.FAILURE) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }

  private static determineComplianceFlags(
    type: AuditEventType,
    details: BaseMetadata
  ): AuditEvent["compliance"] {
    const compliance: AuditEvent["compliance"] = {};

    // GDPR - Personal data processing
    const gdprEvents = [
      AuditEventType.ACCOUNT_CREATED,
      AuditEventType.ACCOUNT_UPDATED,
      AuditEventType.ACCOUNT_DELETED,
      AuditEventType.SENSITIVE_DATA_ACCESSED,
      AuditEventType.DATA_EXPORTED,
    ];

    if (gdprEvents.includes(type) || details.personalData) {
      compliance.gdpr = true;
    }

    // SOX - Financial data and access controls
    const soxEvents = [
      AuditEventType.ROLE_ASSIGNED,
      AuditEventType.ROLE_REMOVED,
      AuditEventType.PRIVILEGE_ESCALATION_ATTEMPT,
      AuditEventType.CONFIGURATION_CHANGED,
    ];

    if (soxEvents.includes(type) || details.financialData) {
      compliance.sox = true;
    }

    // PCI - Payment card data
    if (details.paymentData || details.cardData) {
      compliance.pci = true;
    }

    // HIPAA - Health information
    if (details.healthData || details.medicalData) {
      compliance.hipaa = true;
    }

    return compliance;
  }

  private static extractResourceType(resource: string): string {
    if (resource.includes("user")) return "user";
    if (resource.includes("payment")) return "payment";
    if (resource.includes("admin")) return "admin";
    if (resource.includes("api")) return "api";
    return "unknown";
  }

  private static determineAccessPattern(action: string): string {
    if (action.includes("read") || action.includes("get")) return "read";
    if (action.includes("write") || action.includes("create")) return "write";
    if (action.includes("update") || action.includes("modify")) return "update";
    if (action.includes("delete") || action.includes("remove")) return "delete";
    return "unknown";
  }

  private static addEvent(event: AuditEvent): void {
    this.events.push(event);
    this.cleanupOldEvents();
  }

  private static logToStructuredLogger(event: AuditEvent): void {
    structuredLogger.info(
      `[AUDIT] ${event.description}`,
      "audit",
      event.requestId,
      event.userId,
      {
        auditEventId: event.id,
        auditType: event.type,
        auditResult: event.result,
        auditSeverity: event.severity,
        resource: event.resource,
        action: event.action,
        complianceGdpr: event.compliance.gdpr || false,
        complianceHipaa: event.compliance.hipaa || false,
        complianceSox: event.compliance.sox || false,
        compliancePci: event.compliance.pci || false,
        detailsCount: Object.keys(event.details).length,
        metadataSource: event.metadata.source,
        metadataVersion: event.metadata.version,
        metadataEnvironment: event.metadata.environment,
      }
    );
  }

  private static processComplianceRequirements(event: AuditEvent): void {
    // Process compliance-specific requirements
    if (event.compliance.gdpr) {
      this.processGDPRRequirements(event);
    }

    if (event.compliance.sox) {
      this.processSOXRequirements(event);
    }

    if (event.compliance.pci) {
      this.processPCIRequirements(event);
    }

    if (event.compliance.hipaa) {
      this.processHIPAARequirements(event);
    }
  }

  private static processGDPRRequirements(event: AuditEvent): void {
    // GDPR requires detailed logging of personal data processing
    if (event.severity === AuditSeverity.CRITICAL) {
      // Send to GDPR compliance system
      console.log("[GDPR_AUDIT]", {
        eventId: event.id,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        dataSubject: event.email,
        processingPurpose: event.action,
        legalBasis: "legitimate_interest", // This should be determined based on context
      });
    }
  }

  private static processSOXRequirements(event: AuditEvent): void {
    // SOX requires immutable audit trails for financial controls
    if (
      event.type === AuditEventType.ROLE_ASSIGNED ||
      event.type === AuditEventType.CONFIGURATION_CHANGED
    ) {
      // Send to SOX compliance system
      console.log("[SOX_AUDIT]", {
        eventId: event.id,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        controlType: "access_control",
        changeDescription: event.description,
        approver: event.userId,
      });
    }
  }

  private static processPCIRequirements(event: AuditEvent): void {
    // PCI DSS requires specific logging for payment data access
    console.log("[PCI_AUDIT]", {
      eventId: event.id,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      cardholderDataAccessed: event.details.paymentData || false,
      accessResult: event.result,
    });
  }

  private static processHIPAARequirements(event: AuditEvent): void {
    // HIPAA requires detailed logging of PHI access
    console.log("[HIPAA_AUDIT]", {
      eventId: event.id,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      phiAccessed: event.details.healthData || false,
      accessPurpose: event.action,
      minimumNecessary: true, // This should be validated
    });
  }

  private static cleanupOldEvents(): void {
    const cutoffTime = new Date(
      Date.now() - this.EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000
    );

    // Remove old events (but keep compliance events longer)
    this.events = this.events.filter((event) => {
      // Keep compliance events for longer retention
      if (Object.values(event.compliance).some((flag) => flag)) {
        const complianceCutoff = new Date(
          Date.now() - 7 * 365 * 24 * 60 * 60 * 1000
        ); // 7 years
        return event.timestamp > complianceCutoff;
      }

      return event.timestamp > cutoffTime;
    });

    // Limit total events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  // Query methods
  static getAuditTrail(
    filters: {
      userId?: string;
      eventType?: AuditEventType;
      result?: AuditResult;
      severity?: AuditSeverity;
      timeWindowMinutes?: number;
      resource?: string;
    } = {},
    limit: number = 100
  ): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (filters.timeWindowMinutes) {
      const cutoffTime = new Date(
        Date.now() - filters.timeWindowMinutes * 60 * 1000
      );
      filteredEvents = filteredEvents.filter(
        (event) => event.timestamp > cutoffTime
      );
    }

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(
        (event) => event.userId === filters.userId
      );
    }

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(
        (event) => event.type === filters.eventType
      );
    }

    if (filters.result) {
      filteredEvents = filteredEvents.filter(
        (event) => event.result === filters.result
      );
    }

    if (filters.severity) {
      filteredEvents = filteredEvents.filter(
        (event) => event.severity === filters.severity
      );
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.resource?.includes(filters.resource!) ||
          event.details.resourceType === filters.resource
      );
    }

    return filteredEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Export audit trail
  static exportAuditTrail(
    filters: Parameters<typeof AuditTrail.getAuditTrail>[0] = {},
    format: "json" | "csv" = "json"
  ): string {
    const events = this.getAuditTrail(filters, 10000);

    if (format === "csv") {
      const headers = [
        "ID",
        "Type",
        "Result",
        "Severity",
        "Timestamp",
        "User ID",
        "Email",
        "IP",
        "Resource",
        "Action",
        "Description",
      ];

      const rows = events.map((event) => [
        event.id,
        event.type,
        event.result,
        event.severity,
        event.timestamp.toISOString(),
        event.userId || "",
        event.email || "",
        event.ip,
        event.resource || "",
        event.action,
        event.description.replace(/"/g, '""'), // Escape quotes for CSV
      ]);

      return [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
    }

    return JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        filters,
        totalEvents: events.length,
        events,
      },
      null,
      2
    );
  }
}

// Export convenience functions
export const logAuditEvent = AuditTrail.logEvent.bind(AuditTrail);
export const logSignIn = AuditTrail.logSignIn.bind(AuditTrail);
export const logSignOut = AuditTrail.logSignOut.bind(AuditTrail);
export const logSignUp = AuditTrail.logSignUp.bind(AuditTrail);
export const logPermissionCheck =
  AuditTrail.logPermissionCheck.bind(AuditTrail);
export const logDataAccess = AuditTrail.logDataAccess.bind(AuditTrail);
export const logWebhookEvent = AuditTrail.logWebhookEvent.bind(AuditTrail);
export const logSecurityEvent = AuditTrail.logSecurityEvent.bind(AuditTrail);
