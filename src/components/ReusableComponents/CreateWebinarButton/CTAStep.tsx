"use client";

import React, { useState } from "react";
import { useWebinarStore } from "@/store/useWebinarStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Phone, Mail, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaTypeEnum } from "@prisma/client";
import { StripeProduct } from "@/types/stripe";

type Props = {
  stripeProducts: StripeProduct[];
};

const CTAStep = ({ stripeProducts }: Props) => {
  const {
    formData,
    updateCtaField,
    addTag,
    removeTag,
    getStepValidationErrors,
  } = useWebinarStore();

  const { ctaType, ctaLabel, tags, priceId } = formData.cta;
  const errors = getStepValidationErrors("cta");
  const [tagInput, setTagInput] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateCtaField(name as keyof typeof formData.cta, value);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput("");
    }
  };

  const handleSelectCTAType = (value: CtaTypeEnum) => {
    updateCtaField("ctaType", value);
  };

  const handleProductChange = (value: string) => {
    updateCtaField("priceId", value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="ctaLabel"
          className={errors.ctaLabel ? "text-red-400" : ""}
        >
          CTA Label <span className="text-red-400">*</span>
        </Label>
        <Input
          id="ctaLabel"
          name="ctaLabel"
          value={ctaLabel || ""}
          onChange={handleChange}
          placeholder="Book Your Free Consultation"
          className={cn(
            "!bg-background/50 border border-input",
            errors.ctaLabel && "border-red-400 focus-visible:ring-red-400"
          )}
        />
        {errors.ctaLabel && (
          <p className="text-sm text-red-400">{errors.ctaLabel}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add a tag and press Enter"
          className="!bg-background/50 border border-input"
        />

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
              >
                <span>{tag}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 w-full">
        <Label>
          CTA Type <span className="text-red-400">*</span>
        </Label>
        <Tabs
          value={ctaType || "BOOK_A_CALL"}
          onValueChange={(value) => handleSelectCTAType(value as CtaTypeEnum)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted/30">
            <TabsTrigger
              value="BOOK_A_CALL"
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Book a Call
            </TabsTrigger>
            <TabsTrigger
              value="EMAIL_CAPTURE"
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Capture
            </TabsTrigger>
            <TabsTrigger
              value="EXTERNAL_LINK"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              External Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="BOOK_A_CALL" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="font-medium mb-2">Book a Call</h4>
              <p className="text-sm text-muted-foreground">
                Viewers will be able to book a consultation call with you
                directly.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="EMAIL_CAPTURE" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="font-medium mb-2">Email Capture</h4>
              <p className="text-sm text-muted-foreground">
                Collect viewer email addresses for follow-up marketing.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="EXTERNAL_LINK" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="font-medium mb-2">External Link</h4>
              <p className="text-sm text-muted-foreground">
                Direct viewers to an external website or landing page.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        {errors.ctaType && (
          <p className="text-sm text-red-400">{errors.ctaType}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Attach a Product</Label>
        <div className="relative">
          <div className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Products"
                className="pl-9 !bg-background/50 border border-input"
              />
            </div>
          </div>
          <Select value={priceId} onValueChange={handleProductChange}>
            <SelectTrigger className="w-full !bg-background/50 border border-input">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-input max-h-48">
              {stripeProducts?.length > 0 ? (
                stripeProducts.map((product) => (
                  <SelectItem
                    key={product.id}
                    value={
                      typeof product.default_price === "string"
                        ? product.default_price
                        : product.default_price?.id || ""
                    }
                    className="!bg-background/50 hover:!bg-background/70"
                  >
                    {product.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-products" disabled>
                  No products available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CTAStep;
