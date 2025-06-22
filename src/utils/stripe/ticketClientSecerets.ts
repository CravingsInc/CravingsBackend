import { stripe } from "./stripe";
import * as models from '../../models';
import { Utils } from "../Utils";
import Stripe from "stripe";

export enum PAYMENT_INTENT_TYPE {
  TICKET = "TICKET"
}

export const createPaymentIntent = async (stripeAccount: string, eventId: string, prices: models.TicketBuyClientSecretUpdate[], customer?: string, couponCode?: string) => {
  const cart = await models.EventTicketCart.create({
    completed: false,
    eventId
  }).save();

  let priceList = await Promise.all(prices.map(async (price) => {
    const p = await stripe.prices.retrieve(price.id, { stripeAccount });

    return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
  }));

  const originalTotal = priceList.reduce((prev, curr) => prev + ((curr.amount || 0) * curr.quantity), 0);

  let finalAmount = originalTotal;
  let discountAmount = 0;
  let appliedCoupon = null;

  // Apply coupon if provided
  if (couponCode) {
    const coupon = await models.Coupon.findOne({
      where: { code: couponCode.toUpperCase() },
      relations: ['event', 'specificTicket']
    });

    if (coupon && coupon.active && coupon.event.id === eventId) {
      // Check if coupon applies to all tickets or specific ticket
      let canApplyCoupon = coupon.appliesToAllTickets;

      if (!canApplyCoupon && coupon.specificTicket) {
        // Check if any of the selected tickets match the specific ticket
        const ticketIds = await Promise.all(prices.map(async (price) => {
          const ticket = await models.EventTickets.findOne({ where: { priceId: price.id } });
          return ticket?.id;
        }));
        canApplyCoupon = ticketIds.includes(coupon.specificTicket.id);
      }

      if (canApplyCoupon) {
        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discountAmount = originalTotal * (coupon.discountAmount / 100);
        } else {
          discountAmount = coupon.discountAmount * 100; // Convert to cents
        }

        // Ensure discount doesn't exceed original total
        discountAmount = Math.min(discountAmount, originalTotal);
        finalAmount = originalTotal - discountAmount;
        appliedCoupon = coupon;

        // Update cart with coupon information
        cart.appliedCoupon = coupon;
        cart.appliedCouponId = coupon.id;
        cart.discountAmount = discountAmount / 100; // Store in dollars
        cart.originalTotal = originalTotal / 100; // Store in dollars
        cart.finalTotal = finalAmount / 100; // Store in dollars
      }
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmount > 0.5 ? finalAmount : 0.5,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    customer: customer,
    setup_future_usage: customer ? "off_session" : "on_session",
    transfer_data: {
      destination: stripeAccount
    },
    application_fee_amount: finalAmount * 0.1,

    metadata: {
      customer: customer || null,
      type: PAYMENT_INTENT_TYPE.TICKET,
      eventId,
      cart: cart.id,
      priceList: JSON.stringify(priceList),
      originalTotal: originalTotal.toString(),
      discountAmount: discountAmount.toString(),
      finalAmount: finalAmount.toString(),
      couponId: appliedCoupon?.id || null
    }
  });

  cart.stripeTransactionId = paymentIntent.id;
  await cart.save();

  return {
    client_secret: paymentIntent.client_secret,
    cartId: cart.id
  };
}

export const updatePaymentIntent = async (id: string, prices: models.TicketBuyClientSecretUpdate[], stripeAccount: string, couponCode?: string) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(id);
  const cart = await models.EventTicketCart.findOne({ where: { stripeTransactionId: id } });

  let priceList = await Promise.all(prices.map(async (price) => {
    const p = await stripe.prices.retrieve(price.id, { stripeAccount });

    return { amount: p.unit_amount, quantity: price.quantity, id: price.id };
  }));

  const originalTotal = priceList.reduce((prev, curr) => prev + ((curr.amount || 0) * curr.quantity), 0);

  let finalAmount = originalTotal;
  let discountAmount = 0;
  let appliedCoupon = null;

  // Apply coupon if provided
  if (couponCode) {
    const coupon = await models.Coupon.findOne({
      where: { code: couponCode.toUpperCase() },
      relations: ['event', 'specificTicket']
    });

    if (coupon && coupon.active && cart && coupon.event.id === cart.eventId) {
      // Check if coupon applies to all tickets or specific ticket
      let canApplyCoupon = coupon.appliesToAllTickets;

      if (!canApplyCoupon && coupon.specificTicket) {
        // Check if any of the selected tickets match the specific ticket
        const ticketIds = await Promise.all(prices.map(async (price) => {
          const ticket = await models.EventTickets.findOne({ where: { priceId: price.id } });
          return ticket?.id;
        }));
        canApplyCoupon = ticketIds.includes(coupon.specificTicket.id);
      }

      if (canApplyCoupon) {
        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discountAmount = originalTotal * (coupon.discountAmount / 100);
        } else {
          discountAmount = coupon.discountAmount * 100; // Convert to cents
        }

        // Ensure discount doesn't exceed original total
        discountAmount = Math.min(discountAmount, originalTotal);
        finalAmount = originalTotal - discountAmount;
        appliedCoupon = coupon;

        // Update cart with coupon information
        if (cart) {
          cart.appliedCoupon = coupon;
          cart.appliedCouponId = coupon.id;
          cart.discountAmount = discountAmount / 100; // Store in dollars
          cart.originalTotal = originalTotal / 100; // Store in dollars
          cart.finalTotal = finalAmount / 100; // Store in dollars
          await cart.save();
        }
      }
    }
  }

  const intent = await stripe.paymentIntents.update(
    paymentIntent.id,
    {
      amount: finalAmount,
      application_fee_amount: finalAmount * 0.1,
      metadata: {
        priceList: JSON.stringify(priceList),
        originalTotal: originalTotal.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
        couponId: appliedCoupon?.id || null
      }
    }
  );

  return intent;
}
