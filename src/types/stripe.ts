import { Stripe } from "stripe";
import { Stripe as StripeJS } from "@stripe/stripe-js";

// Extended Stripe types for better type safety
export interface StripeProduct {
  id: string;
  name: string;
  default_price?: Stripe.Price | string | null;
  description?: string | null;
  active: boolean;
  metadata: Stripe.Metadata;
}

export interface StripeInvoiceWithPaymentIntent extends Stripe.Invoice {
  payment_intent: Stripe.PaymentIntent | string;
}

// Utility type for client-side Stripe Promise
export type StripeJSPromise = Promise<StripeJS | null>;

// Type alias for backward compatibility and cleaner imports
export type StripePromise = StripeJSPromise;
