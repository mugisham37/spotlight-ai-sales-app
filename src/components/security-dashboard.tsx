"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SecurityEvent {
  id: string;
  type:
    | "login_success"
    | "login_failure"
    | "unusual_pattern"
    | "brute_force_attempt"
    | "account_locked";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  ipAddress: string;
  location?: string;
  userAgent: string;
  description: string;
  resolved: boolean;
}

interface AccountSecurityStatus {
  isLocked: boolean;
  lockoutUntil?: Date;
  failedAttempts: number;
  lastSuccessfulLogin?: Date;
  unusualActivityDetected: boolean;
  securityScore: number;
}

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className = "" }: SecurityDashboardProps) {
  const { user } = useUser();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accountStatus, setAccountStatus] =
    useState<AccountSecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Load security data
  useEffect(() => {
    loadSecurityData();
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // In a real implementation, this would call your API
      // For now, we'll simulate security data
      const mockEvents: SecurityEvent[] = [
        {
          id: "1",
          type: "login_success",
          severity: "low",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          ipAddress: "192.168.1.100",
          location: "New York, NY",
          userAgent: navigator.userAgent,
          description: "Successful login from trusted device",
          resolved: true,
        },
        {
          id: "2",
          type: "unusual_pattern",
          severity: "medium",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          ipAddress: "10.0.0.50",
          location: "San Francisco, CA",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
          description: "Login from new location detected",
          resolved: false,
        },
        {
          id: "3",
          type: "login_failure",
          severity: "medium",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          ipAddress: "203.0.113.1",
          location: "Unknown",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          description: "Failed login attempt with incorrect credentials",
          resolved: true,
        },
        {
          id: "4",
          type: "brute_force_attempt",
          severity: "high",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          ipAddress: "198.51.100.1",
          location: "Unknown",
          userAgent: "curl/7.68.0",
          description: "Multiple failed login attempts detected",
          resolved: true,
        },
      ];

      const mockStatus: AccountSecurityStatus = {
        isLocked: false,
        failedAttempts: 1,
        lastSuccessfulLogin: new Date(Date.now() - 30 * 60 * 1000),
        unusualActivityDetected: true,
        securityScore: 85,
      };

      setSecurityEvents(mockEvents);
      setAccountStatus(mockStatus);
    } catch (error) {
      console.error("Failed to load security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    try {
      // In a real implementation, this would call your API
      setSecurityEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, resolved: true } : event
        )
      );
      toast.success("Security event resolved");
    } catch (error) {
      console.error("Failed to resolve security event:", error);
      toast.error("Failed to resolve security event");
    }
  };

  const getEventIcon = (
    type: SecurityEvent["type"],
    severity: SecurityEvent["severity"]
  ) => {
    switch (type) {
      case "login_success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "login_failure":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "unusual_pattern":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "brute_force_attempt":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "account_locked":
        return <Lock className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: SecurityEvent["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "critical":
        return "bg-red-200 text-red-900 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const visibleEvents = showAllEvents
    ? securityEvents
    : securityEvents.slice(0, 5);
  const unresolvedEvents = securityEvents.filter((event) => !event.resolved);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
          <CardDescription>
            Monitor your account security and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accountStatus) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No security data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Your account security status and score
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSecurityData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Security Score</span>
              <span
                className={`text-2xl font-bold ${getSecurityScoreColor(
                  accountStatus.securityScore
                )}`}
              >
                {accountStatus.securityScore}/100
              </span>
            </div>
            <Progress value={accountStatus.securityScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on recent activity, login patterns, and security settings
            </p>
          </div>

          {/* Account Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {accountStatus.isLocked ? (
                  <Lock className="h-4 w-4 text-red-500" />
                ) : (
                  <Unlock className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Account Status</span>
              </div>
              <Badge
                variant={accountStatus.isLocked ? "destructive" : "default"}
                className="w-fit"
              >
                {accountStatus.isLocked ? "Locked" : "Active"}
              </Badge>
              {accountStatus.lockoutUntil && (
                <p className="text-xs text-muted-foreground">
                  Locked until {accountStatus.lockoutUntil.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Failed Attempts</span>
              </div>
              <div className="text-2xl font-bold">
                {accountStatus.failedAttempts}
              </div>
              <p className="text-xs text-muted-foreground">
                In the last 24 hours
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Last Login</span>
              </div>
              <div className="text-sm">
                {accountStatus.lastSuccessfulLogin
                  ? formatDistanceToNow(accountStatus.lastSuccessfulLogin, {
                      addSuffix: true,
                    })
                  : "Never"}
              </div>
              {accountStatus.lastSuccessfulLogin && (
                <p className="text-xs text-muted-foreground">
                  {accountStatus.lastSuccessfulLogin.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Alerts */}
          {(accountStatus.unusualActivityDetected ||
            unresolvedEvents.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-amber-800">Security Alerts</p>
                  {accountStatus.unusualActivityDetected && (
                    <p className="text-sm text-amber-700">
                      • Unusual activity detected on your account
                    </p>
                  )}
                  {unresolvedEvents.length > 0 && (
                    <p className="text-sm text-amber-700">
                      • {unresolvedEvents.length} unresolved security event
                      {unresolvedEvents.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Login attempts and security-related activities
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllEvents(!showAllEvents)}
            >
              {showAllEvents ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show All ({securityEvents.length})
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {visibleEvents.length > 0 ? (
            <div className="space-y-4">
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start justify-between p-4 border rounded-lg ${
                    event.resolved ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getEventIcon(event.type, event.severity)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.description}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getSeverityColor(
                            event.severity
                          )}`}
                        >
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(event.timestamp, {
                              addSuffix: true,
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location || event.ipAddress}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          <span className="truncate max-w-xs">
                            {event.userAgent.length > 50
                              ? `${event.userAgent.substring(0, 50)}...`
                              : event.userAgent}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.resolved ? (
                      <Badge variant="secondary" className="text-xs">
                        Resolved
                      </Badge>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Resolve Security Event?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Mark this security event as resolved. This
                              indicates you've reviewed the event and taken any
                              necessary action.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => resolveSecurityEvent(event.id)}
                            >
                              Resolve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No security events found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
