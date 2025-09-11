import { loadStripe } from "@stripe/stripe-js";
import { StripeJSPromise } from "@/types/stripe";

export const useStripeElement = (connectedAccountId?: string) => {
  if (connectedAccountId) {
    const StripePromise: () => StripeJSPromise = async () =>
      await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "", {
        stripeAccount: connectedAccountId,
      });

    return { StripePromise };
  }

  const StripePromise: () => StripeJSPromise = async () =>
    await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
  return { StripePromise };
};
