"use client";

import React from "react";
import { useWebinarStore } from "@/store/useWebinarStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const AdditionalInfoStep = () => {
  const { formData, updateAdditionalInfoField, getStepValidationErrors } =
    useWebinarStore();
  const { lockChat, couponCode, couponEnabled } = formData.additionalInfo;
  const errors = getStepValidationErrors("additionalInfo");

  const handleToggleLockChat = (checked: boolean) => {
    updateAdditionalInfoField("lockChat", checked);
  };

  const handleToggleCoupon = (checked: boolean) => {
    updateAdditionalInfoField("couponEnabled", checked);
    if (!checked) {
      updateAdditionalInfoField("couponCode", "");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-1">
          <Label htmlFor="lock-chat" className="text-base font-medium">
            Lock Chat
          </Label>
          <p className="text-sm text-muted-foreground">
            Turn it on to make chat visible to your users at all times
          </p>
        </div>
        <Switch
          id="lock-chat"
          checked={lockChat || false}
          onCheckedChange={handleToggleLockChat}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="space-y-1">
            <Label htmlFor="coupon-enabled" className="text-base font-medium">
              Coupon Code
            </Label>
            <p className="text-sm text-muted-foreground">
              Turn it on to offer discounts to your viewers
            </p>
          </div>
          <Switch
            id="coupon-enabled"
            checked={couponEnabled || false}
            onCheckedChange={handleToggleCoupon}
          />
        </div>

        {couponEnabled && (
          <div className="space-y-2">
            <Label htmlFor="coupon-code">
              Coupon Code <span className="text-red-400">*</span>
            </Label>
            <Input
              id="coupon-code"
              name="couponCode"
              value={couponCode || ""}
              onChange={(e) =>
                updateAdditionalInfoField("couponCode", e.target.value)
              }
              placeholder="Enter coupon code (e.g., SAVE20)"
              className={cn(
                "!bg-background/50 border border-input",
                errors.couponCode && "border-red-400 focus-visible:ring-red-400"
              )}
            />
            {errors.couponCode && (
              <p className="text-sm text-red-400">{errors.couponCode}</p>
            )}
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200/50 dark:border-blue-800/50">
              <Info className="w-4 h-4 mt-0.5 text-blue-500" />
              <p>Coupon codes are case-sensitive and must be unique.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
