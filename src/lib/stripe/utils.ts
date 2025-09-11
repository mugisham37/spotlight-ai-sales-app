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
