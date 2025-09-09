"use client";

import React from "react";
import { useWebinarStore } from "@/store/useWebinarStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BasicInfoStep = () => {
  const { formData, updateBasicInfoField, getStepValidationErrors } =
    useWebinarStore();
  const { webinarName, description, date, time, timeFormat } =
    formData.basicInfo;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateBasicInfoField(name as keyof typeof formData.basicInfo, value);
  };

  const errors = getStepValidationErrors("basicInfo");

  const handleDateChange = (newDate: Date | undefined) => {
    updateBasicInfoField("date", newDate);
    if (newDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        toast.error("Date cannot be in the past");
      }
    }
  };

  const handleTimeFormatChange = (value: "AM" | "PM") => {
    updateBasicInfoField("timeFormat", value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="webinarName"
          className={errors.webinarName ? "text-red-400" : ""}
        >
          Webinar name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="webinarName"
          name="webinarName"
          value={webinarName || ""}
          onChange={handleChange}
          placeholder="Introduction to Modern Web Development"
          className={cn(
            "!bg-background/50 border border-input",
            errors.webinarName && "border-red-400 focus-visible:ring-red-400"
          )}
        />
        {errors.webinarName && (
          <p className="text-sm text-red-400">{errors.webinarName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="description"
          className={errors.description ? "text-red-400" : ""}
        >
          Description <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={description || ""}
          onChange={handleChange}
          placeholder="Tell your audience what this webinar is about and what they'll learn"
          className={cn(
            "!bg-background/50 border border-input min-h-[100px]",
            errors.description && "border-red-400 focus-visible:ring-red-400"
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={errors.date ? "text-red-400" : ""} htmlFor="date">
            Webinar Date <span className="text-red-400">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between !bg-background/50 border border-input",
                  !date && "text-gray-500",
                  errors.date && "border-red-400 focus-visible:ring-red-400"
                )}
              >
                {date ? format(date, "PPP") : "Select date"}
                <CalendarIcon className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 !bg-background/50 border border-input"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                className="bg-background"
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-red-400">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label className={errors.time ? "text-red-400" : ""} htmlFor="time">
            Webinar Time <span className="text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-foreground/50" />
              <Input
                name="time"
                type="time"
                value={time || ""}
                onChange={handleChange}
                placeholder="10:00"
                className={cn(
                  "!bg-background/50 border border-input pl-10",
                  errors.time && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </div>
            <Select
              value={timeFormat || "AM"}
              onValueChange={handleTimeFormatChange}
            >
              <SelectTrigger className="w-20 !bg-background/50 border border-input">
                <SelectValue placeholder="AM" />
              </SelectTrigger>
              <SelectContent className="!bg-background/50 border border-input">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.time && <p className="text-sm text-red-400">{errors.time}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Uploading a video makes this webinar pre-recorded
        </div>
        <Button
          variant="outline"
          className="ml-auto relative border border-input hover:bg-background/80"
        >
          Upload File
          <Input
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="file"
            accept="video/*"
          />
        </Button>
      </div>
    </div>
  );
};

export default BasicInfoStep;
