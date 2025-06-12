import { loadStripe, Stripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const getStripe = (): Promise<Stripe | null> => {
  return stripePromise;
}; 