import { stripe } from "./stripe";
import * as models from "../../models";
import { Utils } from "../Utils";
import Stripe from "stripe";
import { DiscountResult } from "../service/discountService";

export enum PAYMENT_INTENT_TYPE {
  TICKET = "TICKET",
}

export const createPaymentIntent = async (
  stripeAccount: string,
  eventId: string,
  prices: models.TicketBuyClientSecretUpdate[] | number,
  customer?: string,
  eventType?: models.EventType,
  discountResult?: DiscountResult,
  existingCartId?: string // Add this parameter for existing carts
) => {
  let cart: models.EventTicketCart | null;
  let totalPrice: number;
  let priceList: { amount: number | null; quantity: number; id: string }[] = [];

  // Use existing cart or create new one
  if (existingCartId) {
    cart = await models.EventTicketCart.findOne({
      where: { id: existingCartId },
    });
    if (!cart) throw new Error("Cart not found");
  } else {
    cart = await models.EventTicketCart.create({
      completed: false,
      eventId,
      subtotal: 0,
      totalDiscount: discountResult?.totalDiscount || 0,
      total: 0,
    }).save();
  }

  // Calculate prices
  if (Array.isArray(prices)) {
    priceList = await Promise.all(
      prices.map(async (price) => {
        const p = await stripe.prices.retrieve(price.id, { stripeAccount });
        return {
          amount: p.unit_amount,
          quantity: price.quantity,
          id: price.id,
        };
      })
    );
    totalPrice = priceList.reduce(
      (prev, curr) => prev + (curr.amount || 0) * curr.quantity,
      0
    );
  } else {
    totalPrice = prices;
    priceList = [
      {
        amount: prices,
        quantity: 1,
        id: eventType || models.EventType.PAID_TICKET,
      },
    ];
  }

  // Apply discount if provided
  const subtotal = totalPrice;
  if (discountResult) {
    totalPrice = Math.max(0, totalPrice - discountResult.totalDiscount);
  }

  // Update cart with current values
  cart.subtotal = subtotal;
  cart.totalDiscount = discountResult?.totalDiscount || 0;
  cart.total = totalPrice;

  let paymentIntent: Stripe.PaymentIntent;

  if (cart.stripeTransactionId) {
    // Update existing payment intent
    paymentIntent = await stripe.paymentIntents.update(
      cart.stripeTransactionId,
      {
        amount: Math.max(Math.round(totalPrice * 100), 50),
        currency: "usd",
        application_fee_amount: Math.round(
          totalPrice * Utils.APPLICATION_TICKET_FEE
        ),
        metadata: {
          priceList: JSON.stringify(priceList),
          discountApplied: discountResult ? "true" : "false",
          discountAmount: discountResult?.totalDiscount || 0,
          discountCodes: discountResult?.appliedCodes?.join(",") || "",
          subtotal: subtotal,
          total: totalPrice,
        },
      },
      { stripeAccount }
    );
  } else {
    // Create new payment intent
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalPrice > 50 ? Math.round(totalPrice) : 50,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        customer: customer,
        setup_future_usage: customer ? "off_session" : "on_session",
        transfer_data: {
          destination: stripeAccount,
        },
        application_fee_amount: Math.round(
          totalPrice * Utils.APPLICATION_TICKET_FEE
        ),

        metadata: {
          customer: customer || null,
          type: PAYMENT_INTENT_TYPE.TICKET,
          eventType: eventType || models.EventType.PAID_TICKET,
          eventId,
          cart: cart.id,
          priceList: JSON.stringify(priceList),
          discountApplied: discountResult ? "true" : "false",
          discountAmount: discountResult?.totalDiscount || 0,
          discountCodes: discountResult?.appliedCodes?.join(",") || "",
          subtotal: subtotal,
          total: totalPrice,
        },
      },
      { stripeAccount }
    );

    cart.stripeTransactionId = paymentIntent.id;
  }

  await cart.save();

  return {
    client_secret: paymentIntent.client_secret,
    cartId: cart.id,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    appliedDiscounts: discountResult?.appliedCodes || [],
  };
};

export const updatePaymentIntent = async (
  id: string,
  prices: models.TicketBuyClientSecretUpdate[] | number,
  stripeAccount: string,
  eventType?: models.EventType,
  discountResult?: any
) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(id);

  let totalPrice: number;
  let priceList: { amount: number | null; quantity: number; id: string }[] = [];

  if (Array.isArray(prices)) {
    priceList = await Promise.all(
      prices.map(async (price) => {
        const p = await stripe.prices.retrieve(price.id, { stripeAccount });
        return {
          amount: p.unit_amount,
          quantity: price.quantity,
          id: price.id,
        };
      })
    );
    totalPrice = priceList.reduce(
      (prev, curr) => prev + (curr.amount || 0) * curr.quantity,
      0
    );
  } else {
    totalPrice = prices;
    priceList = [
      {
        amount: prices,
        quantity: 1,
        id: eventType || models.EventType.PAID_TICKET,
      },
    ];
  }

  // Apply discount if provided
  const subtotal = totalPrice;
  if (discountResult) {
    totalPrice = Math.max(0, totalPrice - discountResult.totalDiscount);
  }

  const updatedIntent = await stripe.paymentIntents.update(
    id,
    {
      amount: totalPrice > 0.5 ? Math.round(totalPrice * 100) : 50,
      application_fee_amount: Math.round(
        totalPrice * Utils.APPLICATION_TICKET_FEE
      ),
      metadata: {
        ...paymentIntent.metadata,
        priceList: JSON.stringify(priceList),
        discountApplied: discountResult ? "true" : "false",
        discountAmount: discountResult?.totalDiscount || 0,
        discountCodes: discountResult?.appliedCodes?.join(",") || "",
        subtotal: subtotal,
        total: totalPrice,
      },
    },
    { stripeAccount }
  );

  return {
    client_secret: updatedIntent.client_secret,
    paymentIntentId: updatedIntent.id,
    amount: updatedIntent.amount,
    appliedDiscounts: discountResult?.appliedCodes || [],
    status: updatedIntent.status,
  };
};

// New function to add customer to payment intent
export const addCustomerToPaymentIntent = async (
  paymentIntentId: string,
  customerId: string,
  stripeAccount: string,
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  }
) => {
  const updateData: any = {
    customer: customerId,
  };

  if (customerInfo) {
    updateData.metadata = {
      customerName: customerInfo.name || "",
      customerEmail: customerInfo.email || "",
      customerPhone: customerInfo.phone || "",
    };
  }

  const paymentIntent = await stripe.paymentIntents.update(
    paymentIntentId,
    updateData,
    { stripeAccount }
  );

  return paymentIntent;
};
