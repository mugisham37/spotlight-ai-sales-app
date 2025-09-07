// Security event logging and monitoring system
import { NextRequest } from "next/server";
import { structuredLogger } from "./structured-logger";
import { LogLevel } from "./error-handler";

// Security event types
export enum SecurityEventType {
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INVALID_SIGNATURE = "invalid_signature",
  BLOCKED_REQUEST = "blocked_request",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  DATA_BREACH_ATTEMPT = "data_breach_attempt",
  MALICIOUS_PAYLOAD = "malicious_payload",
  ACCOUNT_TAKEOVER = "account_takeover",
  SESSION_HIJACKING = "session_hijacking",
  CSRF_ATTEMPT = "csrf_attempt",
  XSS_ATTEMPT = "xss_attempt",
  SQL_INJECTION_ATTEMPT = "sql_injection_attempt",
  UNUSUAL_LOGIN_PATTERN = "unusual_login_pattern",
  MULTIPLE_FAILED_LOGINS = "multiple_failed_logins",
  LOGIN_FROM_NEW_LOCATION = "login_from_new_location",
  CONCURRENT_SESSIONS = "concurrent_sessions",
  PASSWORD_SPRAY_ATTACK = "password_spray_attack",
  CREDENTIAL_STUFFING = "credential_stuffing",
}

export enum SecuritySeverity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum SecurityAction {
  LOGGED = "logged",
  BLOCKED = "blocked",
  RATE_LIMITED = "rate_limited",
  ACCOUNT_LOCKED = "account_locked",
  SESSION_TERMINATED = "session_terminated",
  IP_BANNED = "ip_banned",
  ALERT_SENT = "alert_sent",
  INVESTIGATION_REQUIRED = "investigation_required",
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  requestId: string;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  description: string;
  details: Record<string, string | number | boolean | Date | null | undefined>;
  action: SecurityAction;
  riskScore: number; // 0-100
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number];
  };
  deviceFingerprint?: string;
  sessionId?: string;
  correlationId?: string;
}

// Security metrics interface
export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  eventsByAction: Record<SecurityAction, number>;
  riskScoreDistribution: {
    low: number; // 0-30
    medium: number; // 31-70
    high: number; // 71-100
  };
  topRiskyIPs: Array<{ ip: string; events: number; riskScore: number }>;
  topRiskyUsers: Array<{ userId: string; events: number; riskScore: number }>;
  timeWindow: {
    start: Date;
    end: Date;
    durationMinutes: number;
  };
}

// Threat intelligence interface
export interface ThreatIntelligence {
  ip: string;
  isMalicious: boolean;
  threatTypes: string[];
  reputation: number; // 0-100 (0 = clean, 100 = highly malicious)
  lastSeen?: Date;
  source: string;
}

// Security monitoring class
export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 50000;
  private static readonly EVENT_RETENTION_HOURS = 168; // 7 days
  private static readonly RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 70,
    HIGH: 100,
  };

  // Known malicious patterns
  private static readonly MALICIOUS_PATTERNS = {
    USER_AGENTS: [
      /bot|crawler|spider|scraper/i,
      /sqlmap|nikto|nmap|masscan/i,
      /burp|owasp|zap/i,
    ],
    PATHS: [
      /\/admin|\/wp-admin|\/phpmyadmin/i,
      /\.php|\.asp|\.jsp/i,
      /\/api\/v\d+\/admin/i,
      /\/\.env|\/config|\/backup/i,
    ],
    QUERY_PARAMS: [
      /union|select|insert|delete|drop|exec/i,
      /<script|javascript:|vbscript:/i,
      /\.\.|\/etc\/passwd|\/proc\/|\/sys\//i,
    ],
  };

  // Rate limiting tracking
  private static rateLimitTracking = new Map<
    string,
    {
      count: number;
      firstAttempt: Date;
      lastAttempt: Date;
    }
  >();

  // Failed login tracking
  private static failedLoginTracking = new Map<
    string,
    {
      attempts: number;
      firstAttempt: Date;
      lastAttempt: Date;
      ips: Set<string>;
    }
  >();

  // Log security event
  static logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    req: NextRequest,
    requestId: string,
    description: string,
    details: Record<
      string,
      string | number | boolean | Date | null | undefined
    > = {},
    userId?: string,
    email?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      timestamp: new Date(),
      requestId,
      userId,
      email,
      ip: this.extractIP(req),
      userAgent: req.headers.get("user-agent") || "unknown",
      path: req.nextUrl.pathname,
      method: req.method,
      description,
      details,
      action: this.determineSecurityAction(type, severity, details),
      riskScore: this.calculateRiskScore(type, severity, details, req),
      geolocation: this.extractGeolocation(req),
      deviceFingerprint: this.generateDeviceFingerprint(req),
      sessionId: this.extractSessionId(req),
      correlationId: this.generateCorrelationId(type, req),
    };

    this.addEvent(event);
    this.logToStructuredLogger(event);
    this.processSecurityEvent(event);

    return event;
  }

  // Analyze request for security threats
  static analyzeRequest(
    req: NextRequest,
    requestId: string,
    userId?: string
  ): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    const userAgent = req.headers.get("user-agent") || "";
    const path = req.nextUrl.pathname;
    const queryString = req.nextUrl.search;

    // Check for malicious user agents
    if (
      this.MALICIOUS_PATTERNS.USER_AGENTS.some((pattern) =>
        pattern.test(userAgent)
      )
    ) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          SecuritySeverity.MEDIUM,
          req,
          requestId,
          "Malicious user agent detected",
          { userAgent, pattern: "malicious_user_agent" },
          userId
        )
      );
    }

    // Check for suspicious paths
    if (this.MALICIOUS_PATTERNS.PATHS.some((pattern) => pattern.test(path))) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          SecuritySeverity.HIGH,
          req,
          requestId,
          "Suspicious path access attempt",
          { path, pattern: "malicious_path" },
          userId
        )
      );
    }

    // Check for malicious query parameters
    if (
      queryString &&
      this.MALICIOUS_PATTERNS.QUERY_PARAMS.some((pattern) =>
        pattern.test(queryString)
      )
    ) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.SQL_INJECTION_ATTEMPT,
          SecuritySeverity.HIGH,
          req,
          requestId,
          "Potential SQL injection or XSS attempt detected",
          { queryString, pattern: "malicious_query" },
          userId
        )
      );
    }

    // Check for rate limiting violations
    const rateLimitEvent = this.checkRateLimit(req, requestId, userId);
    if (rateLimitEvent) {
      events.push(rateLimitEvent);
    }

    // Check for unusual request patterns
    const patternEvent = this.checkUnusualPatterns(req, requestId, userId);
    if (patternEvent) {
      events.push(patternEvent);
    }

    return events;
  }

  // Track failed login attempts
  static trackFailedLogin(
    email: string,
    ip: string,
    req: NextRequest,
    requestId: string,
    reason: string
  ): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    const key = email.toLowerCase();
    const now = new Date();

    // Get or create tracking entry
    let tracking = this.failedLoginTracking.get(key);
    if (!tracking) {
      tracking = {
        attempts: 0,
        firstAttempt: now,
        lastAttempt: now,
        ips: new Set(),
      };
      this.failedLoginTracking.set(key, tracking);
    }

    tracking.attempts++;
    tracking.lastAttempt = now;
    tracking.ips.add(ip);

    // Log the failed attempt
    events.push(
      this.logSecurityEvent(
        SecurityEventType.MULTIPLE_FAILED_LOGINS,
        tracking.attempts > 5 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
        req,
        requestId,
        `Failed login attempt #${tracking.attempts} for user`,
        {
          email,
          attempts: tracking.attempts,
          timeWindow: now.getTime() - tracking.firstAttempt.getTime(),
          uniqueIPs: tracking.ips.size,
          reason,
        }
      )
    );

    // Check for brute force attack
    if (tracking.attempts >= 5) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.BRUTE_FORCE_ATTEMPT,
          SecuritySeverity.HIGH,
          req,
          requestId,
          "Brute force attack detected",
          {
            email,
            attempts: tracking.attempts,
            timeWindow: now.getTime() - tracking.firstAttempt.getTime(),
            uniqueIPs: tracking.ips.size,
          }
        )
      );
    }

    // Check for credential stuffing (multiple IPs)
    if (tracking.ips.size >= 3) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.CREDENTIAL_STUFFING,
          SecuritySeverity.HIGH,
          req,
          requestId,
          "Credential stuffing attack detected",
          {
            email,
            attempts: tracking.attempts,
            uniqueIPs: tracking.ips.size,
            ipsCount: tracking.ips.size,
          }
        )
      );
    }

    // Clean up old tracking data (older than 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (tracking.firstAttempt < oneHourAgo) {
      this.failedLoginTracking.delete(key);
    }

    return events;
  }

  // Track successful login for anomaly detection
  static trackSuccessfulLogin(
    userId: string,
    email: string,
    ip: string,
    req: NextRequest,
    requestId: string
  ): SecurityEvent[] {
    const events: SecurityEvent[] = [];

    // Check for login from new location (simplified)
    const userAgent = req.headers.get("user-agent") || "";
    const locationKey = `${userId}:${ip}`;

    // In a real implementation, you'd check against a database of known locations
    // For now, we'll use a simple in-memory check
    const knownLocations = new Set<string>();

    if (!knownLocations.has(locationKey)) {
      events.push(
        this.logSecurityEvent(
          SecurityEventType.LOGIN_FROM_NEW_LOCATION,
          SecuritySeverity.MEDIUM,
          req,
          requestId,
          "Login from new location detected",
          {
            userId,
            email,
            ip,
            userAgent,
            isNewLocation: true,
          },
          userId,
          email
        )
      );

      knownLocations.add(locationKey);
    }

    // Clear failed login tracking on successful login
    this.failedLoginTracking.delete(email.toLowerCase());

    return events;
  }

  // Check for rate limiting violations
  private static checkRateLimit(
    req: NextRequest,
    requestId: string,
    userId?: string
  ): SecurityEvent | null {
    const ip = this.extractIP(req);
    const key = userId || ip;
    const now = new Date();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    let tracking = this.rateLimitTracking.get(key);
    if (!tracking) {
      tracking = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
      this.rateLimitTracking.set(key, tracking);
      return null;
    }

    // Reset window if expired
    if (now.getTime() - tracking.firstAttempt.getTime() > windowMs) {
      tracking.count = 1;
      tracking.firstAttempt = now;
      tracking.lastAttempt = now;
      return null;
    }

    tracking.count++;
    tracking.lastAttempt = now;

    if (tracking.count > maxRequests) {
      return this.logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecuritySeverity.MEDIUM,
        req,
        requestId,
        "Rate limit exceeded",
        {
          requests: tracking.count,
          windowMs,
          maxRequests,
          timeWindow: now.getTime() - tracking.firstAttempt.getTime(),
        },
        userId
      );
    }

    return null;
  }

  // Check for unusual request patterns
  private static checkUnusualPatterns(
    req: NextRequest,
    requestId: string,
    userId?: string
  ): SecurityEvent | null {
    const headers = req.headers;
    const suspiciousHeaders = [
      "x-forwarded-host",
      "x-original-url",
      "x-rewrite-url",
      "x-real-ip",
    ];

    const foundSuspiciousHeaders = suspiciousHeaders.filter((header) =>
      headers.has(header)
    );

    if (foundSuspiciousHeaders.length > 0) {
      return this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.MEDIUM,
        req,
        requestId,
        "Suspicious headers detected",
        {
          suspiciousHeadersCount: foundSuspiciousHeaders.length,
          suspiciousHeadersList: foundSuspiciousHeaders.join(","),
        },
        userId
      );
    }

    return null;
  }

  // Calculate risk score for an event
  private static calculateRiskScore(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<
      string,
      string | number | boolean | Date | null | undefined
    >,
    req: NextRequest
  ): number {
    let score = 0;

    // Base score by event type
    const typeScores: Record<SecurityEventType, number> = {
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 20,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 80,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 30,
      [SecurityEventType.INVALID_SIGNATURE]: 70,
      [SecurityEventType.BLOCKED_REQUEST]: 40,
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 60,
      [SecurityEventType.PRIVILEGE_ESCALATION]: 90,
      [SecurityEventType.DATA_BREACH_ATTEMPT]: 95,
      [SecurityEventType.MALICIOUS_PAYLOAD]: 85,
      [SecurityEventType.ACCOUNT_TAKEOVER]: 95,
      [SecurityEventType.SESSION_HIJACKING]: 90,
      [SecurityEventType.CSRF_ATTEMPT]: 60,
      [SecurityEventType.XSS_ATTEMPT]: 70,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 85,
      [SecurityEventType.UNUSUAL_LOGIN_PATTERN]: 40,
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: 50,
      [SecurityEventType.LOGIN_FROM_NEW_LOCATION]: 30,
      [SecurityEventType.CONCURRENT_SESSIONS]: 25,
      [SecurityEventType.PASSWORD_SPRAY_ATTACK]: 75,
      [SecurityEventType.CREDENTIAL_STUFFING]: 80,
    };

    score += typeScores[type] || 20;

    // Severity multiplier
    const severityMultipliers: Record<SecuritySeverity, number> = {
      [SecuritySeverity.INFO]: 0.5,
      [SecuritySeverity.LOW]: 0.7,
      [SecuritySeverity.MEDIUM]: 1.0,
      [SecuritySeverity.HIGH]: 1.5,
      [SecuritySeverity.CRITICAL]: 2.0,
    };

    score *= severityMultipliers[severity];

    // Additional factors
    if (
      details.attempts &&
      typeof details.attempts === "number" &&
      details.attempts > 10
    )
      score += 20;
    if (
      details.uniqueIPs &&
      typeof details.uniqueIPs === "number" &&
      details.uniqueIPs > 5
    )
      score += 15;
    if (details.pattern === "malicious_query") score += 25;
    if (details.pattern === "malicious_path") score += 20;

    // Use req for additional context if needed
    console.log(`Calculated risk score for ${req.nextUrl.pathname}: ${score}`);

    return Math.min(Math.round(score), 100);
  }

  // Determine security action based on event
  private static determineSecurityAction(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, string | number | boolean | Date | null | undefined>
  ): SecurityAction {
    // Critical events require immediate action
    if (severity === SecuritySeverity.CRITICAL) {
      switch (type) {
        case SecurityEventType.ACCOUNT_TAKEOVER:
        case SecurityEventType.SESSION_HIJACKING:
          return SecurityAction.SESSION_TERMINATED;
        case SecurityEventType.DATA_BREACH_ATTEMPT:
        case SecurityEventType.PRIVILEGE_ESCALATION:
          return SecurityAction.INVESTIGATION_REQUIRED;
        default:
          return SecurityAction.BLOCKED;
      }
    }

    // High severity events
    if (severity === SecuritySeverity.HIGH) {
      switch (type) {
        case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        case SecurityEventType.CREDENTIAL_STUFFING:
          return SecurityAction.ACCOUNT_LOCKED;
        case SecurityEventType.SQL_INJECTION_ATTEMPT:
        case SecurityEventType.XSS_ATTEMPT:
          return SecurityAction.BLOCKED;
        default:
          return SecurityAction.RATE_LIMITED;
      }
    }

    // Medium severity events
    if (severity === SecuritySeverity.MEDIUM) {
      if (type === SecurityEventType.RATE_LIMIT_EXCEEDED) {
        return SecurityAction.RATE_LIMITED;
      }
      return SecurityAction.LOGGED;
    }

    // Use details for additional context if needed
    console.log(
      `Determined security action for ${type}: ${SecurityAction.LOGGED}`,
      details
    );

    return SecurityAction.LOGGED;
  }

  // Extract IP address from request
  private static extractIP(req: NextRequest): string {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown"
    );
  }

  // Extract geolocation from request headers
  private static extractGeolocation(
    req: NextRequest
  ): SecurityEvent["geolocation"] {
    return {
      country: req.headers.get("cf-ipcountry") || undefined,
      region: req.headers.get("cf-region") || undefined,
      city: req.headers.get("cf-ipcity") || undefined,
    };
  }

  // Generate device fingerprint
  private static generateDeviceFingerprint(req: NextRequest): string {
    const userAgent = req.headers.get("user-agent") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";
    const acceptEncoding = req.headers.get("accept-encoding") || "";

    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

    // Simple hash function (in production, use a proper hash)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  // Extract session ID from request
  private static extractSessionId(req: NextRequest): string | undefined {
    const sessionCookie =
      req.cookies.get("__session")?.value ||
      req.cookies.get("session")?.value ||
      req.cookies.get("clerk-session")?.value;

    return sessionCookie ? sessionCookie.slice(0, 16) + "..." : undefined;
  }

  // Generate correlation ID for related events
  private static generateCorrelationId(
    type: SecurityEventType,
    req: NextRequest
  ): string {
    const ip = this.extractIP(req);
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute windows

    return `${type}_${ip}_${timestamp}`;
  }

  // Add event to storage
  private static addEvent(event: SecurityEvent): void {
    this.events.push(event);
    this.cleanupOldEvents();
  }

  // Log to structured logger
  private static logToStructuredLogger(event: SecurityEvent): void {
    // Map SecurityEventType to structured logger eventType
    const eventTypeMapping: Record<SecurityEventType, string> = {
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: "suspicious_activity",
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: "brute_force",
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: "rate_limit",
      [SecurityEventType.INVALID_SIGNATURE]: "invalid_signature",
      [SecurityEventType.BLOCKED_REQUEST]: "blocked_request",
      [SecurityEventType.UNAUTHORIZED_ACCESS]: "suspicious_activity",
      [SecurityEventType.PRIVILEGE_ESCALATION]: "suspicious_activity",
      [SecurityEventType.DATA_BREACH_ATTEMPT]: "suspicious_activity",
      [SecurityEventType.MALICIOUS_PAYLOAD]: "suspicious_activity",
      [SecurityEventType.ACCOUNT_TAKEOVER]: "suspicious_activity",
      [SecurityEventType.SESSION_HIJACKING]: "session_hijack_attempt",
      [SecurityEventType.CSRF_ATTEMPT]: "suspicious_activity",
      [SecurityEventType.XSS_ATTEMPT]: "suspicious_activity",
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: "suspicious_activity",
      [SecurityEventType.UNUSUAL_LOGIN_PATTERN]: "unusual_activity_pattern",
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: "multiple_failed_attempts",
      [SecurityEventType.LOGIN_FROM_NEW_LOCATION]: "ip_location_change",
      [SecurityEventType.CONCURRENT_SESSIONS]: "multiple_sessions",
      [SecurityEventType.PASSWORD_SPRAY_ATTACK]: "brute_force",
      [SecurityEventType.CREDENTIAL_STUFFING]: "brute_force",
    };

    // Map SecuritySeverity to structured logger severity
    const severityMapping: Record<
      SecuritySeverity,
      "low" | "medium" | "high" | "critical"
    > = {
      [SecuritySeverity.INFO]: "low",
      [SecuritySeverity.LOW]: "low",
      [SecuritySeverity.MEDIUM]: "medium",
      [SecuritySeverity.HIGH]: "high",
      [SecuritySeverity.CRITICAL]: "critical",
    };

    structuredLogger.logSecurity({
      level:
        event.severity === SecuritySeverity.CRITICAL ||
        event.severity === SecuritySeverity.HIGH
          ? LogLevel.ERROR
          : event.severity === SecuritySeverity.MEDIUM
          ? LogLevel.WARN
          : LogLevel.INFO,
      message: event.description,
      requestId: event.requestId,
      userId: event.userId,
      eventType:
        (eventTypeMapping[event.type] as "suspicious_activity") ||
        "suspicious_activity",
      severity: severityMapping[event.severity] || "medium",
      ip: event.ip,
      userAgent: event.userAgent,
      path: event.path,
      details: {
        ...event.details,
        riskScore: event.riskScore,
        action: event.action,
        geolocation: event.geolocation
          ? JSON.stringify(event.geolocation)
          : undefined,
        deviceFingerprint: event.deviceFingerprint,
      },
    });
  }

  // Process security event (trigger actions)
  private static processSecurityEvent(event: SecurityEvent): void {
    // Send alerts for high-risk events
    if (
      event.riskScore >= this.RISK_THRESHOLDS.HIGH ||
      event.severity === SecuritySeverity.CRITICAL
    ) {
      this.sendSecurityAlert(event);
    }

    // Auto-block for certain event types
    if (
      event.action === SecurityAction.BLOCKED ||
      event.action === SecurityAction.IP_BANNED
    ) {
      this.autoBlockIP(event.ip, event);
    }

    // Rate limit for certain events
    if (event.action === SecurityAction.RATE_LIMITED) {
      this.applyRateLimit(event.ip, event);
    }
  }

  // Send security alert
  private static sendSecurityAlert(event: SecurityEvent): void {
    // In production, integrate with alerting systems
    console.error("[SECURITY_ALERT]", {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      riskScore: event.riskScore,
      description: event.description,
      ip: event.ip,
      userId: event.userId,
      timestamp: event.timestamp.toISOString(),
      details: event.details,
    });

    // TODO: Integrate with external alerting systems
    // - PagerDuty for critical incidents
    // - Slack for team notifications
    // - Email for security team
    // - SIEM systems for correlation
  }

  // Auto-block IP address
  private static autoBlockIP(ip: string, event: SecurityEvent): void {
    // In production, integrate with firewall/WAF
    console.warn("[IP_BLOCKED]", {
      ip,
      reason: event.description,
      eventId: event.id,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Integrate with infrastructure
    // - Update firewall rules
    // - Add to WAF blocklist
    // - Update load balancer rules
  }

  // Apply rate limiting
  private static applyRateLimit(ip: string, event: SecurityEvent): void {
    // In production, integrate with rate limiting service
    console.warn("[RATE_LIMITED]", {
      ip,
      reason: event.description,
      eventId: event.id,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Integrate with rate limiting service
    // - Redis-based rate limiting
    // - CDN rate limiting
    // - API gateway rate limiting
  }

  // Clean up old events
  private static cleanupOldEvents(): void {
    const cutoffTime = new Date(
      Date.now() - this.EVENT_RETENTION_HOURS * 60 * 60 * 1000
    );

    // Remove old events
    this.events = this.events.filter((event) => event.timestamp > cutoffTime);

    // Limit total events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  // Get security metrics
  static getSecurityMetrics(timeWindowMinutes: number = 60): SecurityMetrics {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentEvents = this.events.filter(
      (event) => event.timestamp > cutoffTime
    );

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecuritySeverity, number>;
    const eventsByAction = {} as Record<SecurityAction, number>;
    const ipRiskScores = new Map<
      string,
      { events: number; totalRisk: number }
    >();
    const userRiskScores = new Map<
      string,
      { events: number; totalRisk: number }
    >();

    let lowRisk = 0,
      mediumRisk = 0,
      highRisk = 0;

    recentEvents.forEach((event) => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count by severity
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;

      // Count by action
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;

      // Risk score distribution
      if (event.riskScore <= 30) lowRisk++;
      else if (event.riskScore <= 70) mediumRisk++;
      else highRisk++;

      // IP risk tracking
      const ipData = ipRiskScores.get(event.ip) || { events: 0, totalRisk: 0 };
      ipData.events++;
      ipData.totalRisk += event.riskScore;
      ipRiskScores.set(event.ip, ipData);

      // User risk tracking
      if (event.userId) {
        const userData = userRiskScores.get(event.userId) || {
          events: 0,
          totalRisk: 0,
        };
        userData.events++;
        userData.totalRisk += event.riskScore;
        userRiskScores.set(event.userId, userData);
      }
    });

    // Top risky IPs
    const topRiskyIPs = Array.from(ipRiskScores.entries())
      .map(([ip, data]) => ({
        ip,
        events: data.events,
        riskScore: Math.round(data.totalRisk / data.events),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Top risky users
    const topRiskyUsers = Array.from(userRiskScores.entries())
      .map(([userId, data]) => ({
        userId,
        events: data.events,
        riskScore: Math.round(data.totalRisk / data.events),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      eventsByAction,
      riskScoreDistribution: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
      },
      topRiskyIPs,
      topRiskyUsers,
      timeWindow: {
        start: cutoffTime,
        end: new Date(),
        durationMinutes: timeWindowMinutes,
      },
    };
  }

  // Get recent security events
  static getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Export security events
  static exportSecurityEvents(
    timeWindowMinutes?: number,
    eventType?: SecurityEventType,
    severity?: SecuritySeverity
  ): string {
    let eventsToExport = [...this.events];

    if (timeWindowMinutes) {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      eventsToExport = eventsToExport.filter(
        (event) => event.timestamp > cutoffTime
      );
    }

    if (eventType) {
      eventsToExport = eventsToExport.filter(
        (event) => event.type === eventType
      );
    }

    if (severity) {
      eventsToExport = eventsToExport.filter(
        (event) => event.severity === severity
      );
    }

    return JSON.stringify(
      {
        exportTimestamp: new Date().toISOString(),
        filters: { timeWindowMinutes, eventType, severity },
        totalEvents: eventsToExport.length,
        events: eventsToExport,
        metrics: this.getSecurityMetrics(timeWindowMinutes),
      },
      null,
      2
    );
  }
}

// Export convenience functions
export const logSecurityEvent =
  SecurityMonitor.logSecurityEvent.bind(SecurityMonitor);
export const analyzeRequest =
  SecurityMonitor.analyzeRequest.bind(SecurityMonitor);
export const trackFailedLogin =
  SecurityMonitor.trackFailedLogin.bind(SecurityMonitor);
export const trackSuccessfulLogin =
  SecurityMonitor.trackSuccessfulLogin.bind(SecurityMonitor);
export const getSecurityMetrics =
  SecurityMonitor.getSecurityMetrics.bind(SecurityMonitor);
