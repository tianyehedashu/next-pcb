import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Must match TypeScript types and webhook events
  appInfo: {
    name: 'SpeedxPCB',
    version: '1.0.0',
  },
  typescript: true,
}); 