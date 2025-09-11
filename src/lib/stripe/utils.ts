// Stripe utility functions
export const formatPrice = (amount: number, currency: string = "usd") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

// Generate Stripe Connect OAuth link
export const getStripeOAuthLink = (endpoint: string, userId: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const redirectUri = `${baseUrl}/${endpoint}`;
  const clientId = process.env.STRIPE_CLIENT_ID;

  if (!clientId) {
    console.error("STRIPE_CLIENT_ID environment variable is not set");
    return "/settings?error=stripe_config";
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: redirectUri,
    state: userId, // Pass user ID as state for security
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
};
