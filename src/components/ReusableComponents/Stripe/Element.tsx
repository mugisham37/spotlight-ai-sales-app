import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { useStripeElement } from "@/lib/stripe/stripe-client";
import { StripeJSPromise } from "@/types/stripe";

type Props = {
  children: React.ReactNode;
  connectedAccountId?: string;
};

export const StripeElement = ({ children, connectedAccountId }: Props) => {
  const { StripePromise } = useStripeElement(connectedAccountId);
  const [stripePromise, setStripePromise] =
    React.useState<Awaited<StripeJSPromise> | null>(null);

  React.useEffect(() => {
    StripePromise().then(setStripePromise);
  }, [StripePromise]);

  return stripePromise ? (
    <Elements stripe={stripePromise}>{children}</Elements>
  ) : null;
};
