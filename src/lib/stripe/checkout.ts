/**
 * lib/stripe/checkout.ts — WakiaYoung
 *
 * Stripe client singleton + price ID resolver.
 * All pricing logic lives here. Never put price IDs in client code.
 *
 * Markets & prices (CONTEXT.md §11 rule 8):
 *   USA:   full $797  /  early bird $497
 *   LATAM: full $297  /  early bird $197
 */

import Stripe from 'stripe'
import type { Market } from '@/types'

// Lazy singleton — only instantiated on first use (never at build time)
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover', typescript: true })
  }
  return _stripe
}

export type PriceType = 'full' | 'early'

/** Maps market + priceType → Stripe Price ID from env vars. */
export function getPriceId(market: Market, priceType: PriceType): string {
  const map: Record<Market, Record<PriceType, string>> = {
    USA:   {
      full:  process.env.STRIPE_PRICE_USA_FULL!,
      early: process.env.STRIPE_PRICE_USA_EARLY!,
    },
    LATAM: {
      full:  process.env.STRIPE_PRICE_LATAM_FULL!,
      early: process.env.STRIPE_PRICE_LATAM_EARLY!,
    },
  }
  const priceId = map[market]?.[priceType]
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${market}/${priceType}. Check env vars.`)
  }
  return priceId
}

/** USD amounts for display (not billing — Stripe controls the actual amount). */
export const PRICES: Record<Market, Record<PriceType, number>> = {
  USA:   { full: 797, early: 497 },
  LATAM: { full: 297, early: 197 },
}

export interface CheckoutParams {
  market:       Market
  priceType:    PriceType
  studentName:  string
  studentEmail: string
  studentAge:   number
  country:      string
  parentName?:  string
  parentEmail?: string
}

/**
 * Create a Stripe Checkout Session.
 * All student data is stored in session metadata so the webhook
 * can create the enrollment without trusting client input.
 */
export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
  const {
    market, priceType,
    studentName, studentEmail, studentAge,
    country, parentName, parentEmail,
  } = params

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const priceId  = getPriceId(market, priceType)

  const session = await getStripe().checkout.sessions.create({
    mode:           'payment',
    payment_method_types: ['card'],
    customer_email: studentEmail,
    line_items: [{
      price:    priceId,
      quantity: 1,
    }],
    success_url: `${appUrl}/apply?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/apply?market=${market}&price=${priceType}&cancelled=true`,
    metadata: {
      student_name:  studentName,
      student_email: studentEmail,
      student_age:   String(studentAge),
      country,
      market,
      price_type:    priceType,
      parent_name:   parentName  ?? '',
      parent_email:  parentEmail ?? '',
    },
    // Allow 30 min to complete payment
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}
