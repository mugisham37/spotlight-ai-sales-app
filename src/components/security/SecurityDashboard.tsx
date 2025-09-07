"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Globe,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { SecurityMonitor, SecurityMetrics } from "@/lib/security-monitor";
import { AuditTrail } from "@/lib/audit-trail";

interface SecurityDashboardProps {
  timeWindow?: number; // minutes
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  timeWindow = 60,
  autoRefresh = true,
  refreshInterval = 30,
}) => {
  const [metrics, setMetrics] = React.useState<SecurityMetrics | null>(null);
  const [auditEvents, setAuditEvents] = React.useState<
    Array<{
      id: string;
      timestamp: Date;
      description: string;
      result: string;
      severity: string;
      email?: string;
      resource?: string;
      action: string;
    }>
  >([]);
  const [securityEvents, setSecurityEvents] = React.useState<
    Array<{
      id: string;
      timestamp: Date;
      description: string;
      severity: string;
      riskScore: number;
      ip: string;
      type: string;
      action: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

  // Fetch security data
  const fetchSecurityData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Get security metrics
      const securityMetrics = SecurityMonitor.getSecurityMetrics(timeWindow);
      setMetrics(securityMetrics);

      // Get recent security events
      const recentSecurityEvents = SecurityMonitor.getRecentEvents(50);
      setSecurityEvents(recentSecurityEvents);

      // Get audit trail
      const recentAuditEvents = AuditTrail.getAuditTrail(
        { timeWindowMinutes: timeWindow },
        50
      );
      setAuditEvents(recentAuditEvents);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch security data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [timeWindow]);

  // Initial load and auto-refresh
  React.useEffect(() => {
    fetchSecurityData();

    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchSecurityData, autoRefresh, refreshInterval]);

  // Export security data
  const handleExport = (type: "security" | "audit") => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (type === "security") {
      const data = SecurityMonitor.exportSecurityEvents(timeWindow);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-events-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = AuditTrail.exportAuditTrail({
        timeWindowMinutes: timeWindow,
      });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-trail-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventTypeIcon = (type: string) => {
    if (type.includes("brute_force") || type.includes("failed_login")) {
      return <Ban className="h-4 w-4" />;
    }
    if (type.includes("suspicious") || type.includes("malicious")) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (type.includes("sign_in") || type.includes("sign_up")) {
      return <Users className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()} • Showing data from
            last {timeWindow} minutes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("security")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Security events detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Risk Events
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.riskScoreDistribution.high}
              </div>
              <p className="text-xs text-muted-foreground">Risk score 71-100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risky IPs</CardTitle>
              <Globe className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.topRiskyIPs.length}
              </div>
              <p className="text-xs text-muted-foreground">
                IP addresses flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Alerts
              </CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.eventsBySeverity.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Score Distribution */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Risk Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Risk (0-30)</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.riskScoreDistribution.low} events
                </span>
              </div>
              <Progress
                value={
                  (metrics.riskScoreDistribution.low / metrics.totalEvents) *
                  100
                }
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium Risk (31-70)</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.riskScoreDistribution.medium} events
                </span>
              </div>
              <Progress
                value={
                  (metrics.riskScoreDistribution.medium / metrics.totalEvents) *
                  100
                }
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High Risk (71-100)</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.riskScoreDistribution.high} events
                </span>
              </div>
              <Progress
                value={
                  (metrics.riskScoreDistribution.high / metrics.totalEvents) *
                  100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Events */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="risky-ips">Risky IPs</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Security Events
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("security")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No security events in the selected time window
                  </div>
                ) : (
                  securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <Badge variant="outline">
                            Risk: {event.riskScore}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {event.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          IP: {event.ip} • Type: {event.type} • Action:{" "}
                          {event.action}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Audit Trail
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("audit")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    No audit events in the selected time window
                  </div>
                ) : (
                  auditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {event.result === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              event.result === "success"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {event.result}
                          </Badge>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {event.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          User: {event.email || "System"} • Resource:{" "}
                          {event.resource || "N/A"} • Action: {event.action}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risky-ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                High-Risk IP Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.topRiskyIPs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No high-risk IP addresses detected
                  </div>
                ) : (
                  metrics?.topRiskyIPs.map((ipData, index) => (
                    <div
                      key={ipData.ip}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{ipData.ip}</p>
                          <p className="text-sm text-muted-foreground">
                            {ipData.events} events
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            ipData.riskScore >= 80
                              ? "bg-red-100 text-red-800"
                              : ipData.riskScore >= 60
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          Risk: {ipData.riskScore}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Ban className="h-3 w-3 mr-1" />
                          Block
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
