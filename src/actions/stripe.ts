"use server";

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { onAuthenticateUser } from "./auth";
import prismaClient from "@/lib/prismaClient";
import { subscriptionPriceId } from "@/lib/data";
import { StripeProduct, StripeInvoiceWithPaymentIntent } from "@/types/stripe";

export const getAllProductsFromStripe = async () => {
  try {
    const currentUser = await onAuthenticateUser();
    if (!currentUser.user) {
      return {
        error: "User not authenticated",
        status: 401,
        success: false,
        products: [],
      };
    }

    if (!currentUser.user.stripeConnectId) {
      return {
        error: "Stripe account not connected",
        status: 400,
        success: false,
        products: [],
      };
    }

    const products = await stripe.products.list(
      {
        expand: ["data.default_price"],
      },
      {
        stripeAccount: currentUser.user.stripeConnectId,
      }
    );

    return {
      products: products.data as StripeProduct[],
      status: 200,
      success: true,
    };
  } catch (error) {
    console.log("Error getting products from Stripe", error);
    return {
      error: "Error getting products from Stripe",
      status: 500,
      success: false,
      products: [],
    };
  }
};

export const onGetStripeClientSecret = async (
  email: string,
  userId: string
) => {
  try {
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
    });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
    }

    await prismaClient.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: subscriptionPriceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: userId },
    });

    const invoice =
      subscription.latest_invoice as StripeInvoiceWithPaymentIntent;
    const paymentIntent =
      typeof invoice?.payment_intent === "string"
        ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
        : (invoice?.payment_intent as Stripe.PaymentIntent);
    return {
      status: 200,
      secret: paymentIntent.client_secret,
      customerId: customer.id,
    };
  } catch (error) {
    console.log("Error creating Stripe client secret", error);
    return {
      error: "Failed to create subscription",
      status: 400,
    };
  }
};

export const updateSubscription = async (subscription: Stripe.Subscription) => {
  try {
    const userId = subscription.metadata.userId;

    await prismaClient.user.update({
      where: { id: userId },
      data: {
        subscription: subscription.status === "active" ? true : false,
      },
    });
  } catch (error) {
    console.log("Error updating subscription", error);
  }
};
