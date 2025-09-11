import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
    appInfo: {
      name: "Spotlight AI Sales",
      version: "0.1.0",
    },
  });

  return stripeInstance;
}

// For backward compatibility
export const stripe = {
  get webhooks() {
    return getStripeInstance().webhooks;
  },
  get subscriptions() {
    return getStripeInstance().subscriptions;
  },
  get customers() {
    return getStripeInstance().customers;
  },
  get products() {
    return getStripeInstance().products;
  },
  get prices() {
    return getStripeInstance().prices;
  },
  get paymentIntents() {
    return getStripeInstance().paymentIntents;
  },
  get accounts() {
    return getStripeInstance().accounts;
  },
  get oauth() {
    return getStripeInstance().oauth;
  },
};
