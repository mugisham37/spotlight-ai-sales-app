import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WebinarStatusEnum, CallStatusEnum } from "@prisma/client";
import { useAttendeeStore } from "@/store/useAttendeeStore";
import { registerAttendee } from "@/actions/attendence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type Props = {
  webinarId: string;
  webinarStatus: WebinarStatusEnum;
  onRegistered?: () => void;
};

const WaitListComponent = ({
  webinarId,
  webinarStatus,
  onRegistered,
}: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const { setAttendee } = useAttendeeStore();

  const buttonText = () => {
    switch (webinarStatus) {
      case WebinarStatusEnum.SCHEDULED:
        return "Get reminder";
      case WebinarStatusEnum.WAITING_ROOM:
        return "Get Reminder";
      case WebinarStatusEnum.LIVE:
        return "Join Now";
      default:
        return "Register";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await registerAttendee({
        email,
        name,
        webinarId: webinarId,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to register");
      }

      if (res.data?.user) {
        setAttendee({
          id: res.data.user.id,
          email: res.data.user.email,
          name: res.data.user.name || "",
          attendedAt: new Date(),
          stripeConnectId: null,
          callStatus: CallStatusEnum.PENDING,
        });
      }

      toast.success(
        webinarStatus === WebinarStatusEnum.LIVE
          ? "You have successfully joined the webinar"
          : "You have been added to the waitlist"
      );
      setEmail("");
      setName("");
      setSubmitted(true);

      setTimeout(() => {
        setIsOpen(false);

        if (webinarStatus === WebinarStatusEnum.LIVE) {
          router.refresh();
        }
        if (onRegistered) onRegistered();
      }, 1500);
    } catch (error) {
      console.log("Failed to register attendee", error);
      toast.error((error as Error).message || "Failed to register");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={`${
            webinarStatus === WebinarStatusEnum.LIVE
              ? "bg-red-600 hover:bg-red-700"
              : "bg-primary hover:bg-primary/90"
          } rounded-md px-4 py-2 text-primary-foreground text-sm font-semibold`}
        >
          {webinarStatus === WebinarStatusEnum.LIVE && (
            <span className="mr-2 h-2 w-2 bg-white rounded-full animate-pulse"></span>
          )}
          {buttonText()}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent">
        <DialogHeader className="justify-center items-center border border-input rounded-xl p-4 bg-background">
          <DialogTitle className="text-center text-lg font-semibold mb-4">
            {webinarStatus === WebinarStatusEnum.LIVE
              ? "The webinar is live now!"
              : "Join the waitlist"}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {!submitted && (
              <React.Fragment>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </React.Fragment>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || submitted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  {webinarStatus === WebinarStatusEnum.LIVE
                    ? "Joining..."
                    : "Joining the waitlist..."}
                </>
              ) : submitted ? (
                webinarStatus === WebinarStatusEnum.LIVE ? (
                  "Joined"
                ) : (
                  "Joined the waitlist"
                )
              ) : webinarStatus === WebinarStatusEnum.LIVE ? (
                "Join Now"
              ) : (
                "Join the waitlist"
              )}
            </Button>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default WaitListComponent;
