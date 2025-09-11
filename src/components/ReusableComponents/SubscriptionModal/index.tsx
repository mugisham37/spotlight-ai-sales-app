import React from "react";
import { useRouter } from "next/navigation";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { onGetStripeClientSecret } from "@/actions/stripe";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string | null;
};

type Props = {
  user: User;
};

const SubscriptionModal = ({ user }: Props) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      if (!stripe || !elements) {
        return toast.error("Stripe not initialized");
      }
      const intent = await onGetStripeClientSecret(user.email, user.id);

      if (!intent?.secret) {
        throw new Error("No client secret returned");
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("No card element found");
      }
      const { error } = await stripe.confirmCardPayment(intent.secret, {
        payment_method: { card: cardElement },
      });
      if (error) {
        throw new Error(error.message);
      }
      console.log("Payment Successful");
      router.refresh();
    } catch (error) {
      console.log("SUBSCRIPTION-->", error);
      toast.error("Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl flex gap-2 items-center hover:cursor-pointer px-4 py-2 border border-border bg-primary/10 backdrop-blur-sm text-sm font-normal text-primary hover:bg-primary/20"
        >
          <Plus className="w-4 h-4" />
          Create Webinar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Spotlight Subscription</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#B4B0AE",
                  "::placeholder": {
                    color: "#B4B0AE",
                  },
                },
              },
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Subscribe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
