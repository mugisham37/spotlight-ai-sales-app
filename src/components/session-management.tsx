"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
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
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Shield,
  Trash2,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SessionInfo {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  deviceFingerprint?: string;
  isCurrent?: boolean;
}

interface SessionManagementProps {
  className?: string;
}

export function SessionManagement({ className = "" }: SessionManagementProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);

  // Load user sessions
  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // In a real implementation, this would call your API
      // For now, we'll simulate session data
      const mockSessions: SessionInfo[] = [
        {
          sessionId: "current-session",
          userId: user.id,
          ipAddress: "192.168.1.100",
          userAgent: navigator.userAgent,
          location: "New York, NY",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          lastActivity: new Date(),
          isActive: true,
          isCurrent: true,
        },
        {
          sessionId: "mobile-session",
          userId: user.id,
          ipAddress: "192.168.1.101",
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
          location: "New York, NY",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isActive: true,
          isCurrent: false,
        },
        {
          sessionId: "old-session",
          userId: user.id,
          ipAddress: "10.0.0.50",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          location: "San Francisco, CA",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isActive: false,
          isCurrent: false,
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("iphone") ||
      ua.includes("android")
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceType = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("iphone")) return "iPhone";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ipad")) return "iPad";
    if (ua.includes("mobile")) return "Mobile";
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "Mac";
    if (ua.includes("linux")) return "Linux";
    return "Unknown";
  };

  const getBrowser = (userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari")) return "Safari";
    if (ua.includes("edge")) return "Edge";
    return "Unknown";
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setTerminating(sessionId);

      // In a real implementation, this would call your API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Session terminated successfully");
    } catch (error) {
      console.error("Failed to terminate session:", error);
      toast.error("Failed to terminate session");
    } finally {
      setTerminating(null);
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      setTerminatingAll(true);

      // In a real implementation, this would call your API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      const currentSession = sessions.find((s) => s.isCurrent);
      setSessions(currentSession ? [currentSession] : []);

      toast.success("All other sessions terminated successfully");
    } catch (error) {
      console.error("Failed to terminate other sessions:", error);
      toast.error("Failed to terminate other sessions");
    } finally {
      setTerminatingAll(false);
    }
  };

  const signOutEverywhere = async () => {
    try {
      await terminateAllOtherSessions();
      await signOut({ redirectUrl: "/sign-in?reason=signed_out_everywhere" });
    } catch (error) {
      console.error("Failed to sign out everywhere:", error);
      toast.error("Failed to sign out everywhere");
    }
  };

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions and devices
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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Session Management
            </CardTitle>
            <CardDescription>
              Manage your active sessions and devices
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {activeSessions.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out Everywhere
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign Out Everywhere?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will terminate all your active sessions and sign you
                      out from all devices. You'll need to sign in again on each
                      device.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={signOutEverywhere}>
                      Sign Out Everywhere
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Active Sessions</h3>
            <Badge variant="secondary">{activeSessions.length} active</Badge>
          </div>

          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.userAgent)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getDeviceType(session.userAgent)} •{" "}
                          {getBrowser(session.userAgent)}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.location || session.ipAddress}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Last active{" "}
                          {formatDistanceToNow(session.lastActivity, {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={terminating === session.sessionId}
                        >
                          {terminating === session.sessionId ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Terminate Session?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will sign out this device and terminate the
                            session. The user will need to sign in again on that
                            device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => terminateSession(session.sessionId)}
                          >
                            Terminate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}

              {activeSessions.length > 1 && (
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={terminatingAll}
                        className="w-full"
                      >
                        {terminatingAll ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Terminating...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Terminate All Other Sessions
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Terminate All Other Sessions?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will terminate all your other active sessions
                          except the current one. You'll remain signed in on
                          this device but will need to sign in again on other
                          devices.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={terminateAllOtherSessions}>
                          Terminate All Others
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          )}
        </div>

        {/* Inactive Sessions */}
        {inactiveSessions.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Sessions</h3>
                <Badge variant="outline">
                  {inactiveSessions.length} inactive
                </Badge>
              </div>

              <div className="space-y-3">
                {inactiveSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.userAgent)}
                      <div>
                        <div className="font-medium">
                          {getDeviceType(session.userAgent)} •{" "}
                          {getBrowser(session.userAgent)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.location || session.ipAddress}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Last active{" "}
                            {formatDistanceToNow(session.lastActivity, {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">Security Notice</p>
              <p className="text-amber-700">
                If you see any sessions you don't recognize, terminate them
                immediately and consider changing your password. Always sign out
                from shared or public devices.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
