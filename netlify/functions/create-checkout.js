/**
 * create-checkout.js
 * Netlify serverless function — creates a Stripe Checkout session
 * and returns the hosted checkout URL to the frontend.
 *
 * SETUP:
 *   1. npm install stripe  (in your project root)
 *   2. Set environment variable STRIPE_SECRET_KEY in Netlify dashboard
 *      (Site Settings → Environment Variables)
 *   3. Place this file at: netlify/functions/create-checkout.js
 *
 * For Vercel: place at /api/create-checkout.js and change
 *   exports.handler  →  export default function handler(req, res)
 *   and adjust the response format accordingly (see Vercel docs).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const {
    amount,      // integer, in cents (e.g. 5000 = $50.00)
    type,        // string label, e.g. "Donation" | "Website Service"
    firstName,
    lastName,
    email,
    note,
    successUrl,
    cancelUrl,
  } = body;

  // Basic validation
  if (!amount || typeof amount !== 'number' || amount < 500) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Amount must be at least $5.00' }),
    };
  }

  // Build customer name if provided
  const customerName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

  // Build the description shown on Stripe's checkout page
  const description = note
    ? `${type} — ${note}`
    : type;

  try {
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: type,
              description: note || `Payment to Elikonas — ${type}`,
              // Optional: add an image URL for your Stripe checkout page
              // images: ['https://elikonas.com/your-logo.png'],
            },
          },
          quantity: 1,
        },
      ],
      // Pre-fill customer email in Stripe checkout if provided
      ...(email && { customer_email: email }),
      // Metadata is stored in your Stripe dashboard with each payment
      metadata: {
        payment_type: type,
        customer_name: customerName || 'Anonymous',
        customer_email: email || '',
        note: note || '',
      },
      success_url: successUrl || 'https://elikonas.com/payment-success',
      cancel_url:  cancelUrl  || 'https://elikonas.com/payment',
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://elikonas.com',
      },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment setup failed. Please try again.' }),
    };
  }
};
