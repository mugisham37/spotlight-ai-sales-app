"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Settings, User } from "lucide-react";
import { MFAManagement } from "@/components/auth/MFAManagement";

const SecuritySettingsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Security Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account security and authentication preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Multi-Factor Authentication Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Multi-Factor Authentication
            </h2>
            <p className="text-muted-foreground">
              Secure your account with an additional verification step during
              sign-in
            </p>
          </div>
          <MFAManagement />
        </section>

        <Separator />

        {/* Account Security Overview */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Security Overview</span>
              </CardTitle>
              <CardDescription>
                Review your account security status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Account Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Your email address is verified
                      </p>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">
                    ✓ Verified
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Password Security</p>
                      <p className="text-sm text-muted-foreground">
                        Strong password with recent updates
                      </p>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">
                    ✓ Strong
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Recommendations */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
              <CardDescription>
                Follow these best practices to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Enable Multi-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to prevent unauthorized
                      access
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Use Strong, Unique Passwords</p>
                    <p className="text-sm text-muted-foreground">
                      Create complex passwords that are unique to this account
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Keep Recovery Codes Safe</p>
                    <p className="text-sm text-muted-foreground">
                      Store backup codes in a secure location separate from your
                      device
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
