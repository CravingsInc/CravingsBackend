import express from "express";
import Stripe from "stripe";
import { stripeHandler  } from "../../utils";

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      event = stripeHandler.constructWebHookEvent( req.body, sig as string );
    } catch ( err : any ) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // PaymentIntent succeeded, handle accordingly
        const paymentIntent = event.data.object as any;
  
        if ( !paymentIntent.metadata ) return res.json({ received: true });;
  
        if ( paymentIntent.metadata.type === stripeHandler.PAYMENT_INTENT_TYPE.TICKET ) {
          if ( paymentIntent.metadata.eventId  && paymentIntent.metadata.priceList && paymentIntent.metadata.cart ) {
            let name, email = "";
  
            try {
              const charge = ( await stripeHandler.getChargeById(paymentIntent.latest_charge) ) as Stripe.Charge;
  
              let billingDetails = charge.billing_details;
  
              name = billingDetails.name || "";
              email = billingDetails.email || "";
            }catch(e) {
              console.log(e);
            }
  
            let response = await stripeHandler.StripeWebHooks.buyTicketSuccedded( paymentIntent.id, paymentIntent.metadata, name, email );
  
            return res.status( response.status ).send( response.message );
          }
          else return res.status(500).send('Required metadata not given');
        }
  
        break;
      case 'payment_intent.payment_failed':
        // PaymentIntent failed, handle accordingly
        console.log( event );
        break;
      // Handle other event types as needed
    }
  
    res.json({ received: true });
  });
  
router.post('/webhook/connect', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      event = stripeHandler.constructWebHookConnectEvent( req.body, sig as string );
    } catch ( err : any ) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // Handle specific event types
    switch (event.type) {
      case 'account.updated':
        // PaymentIntent succeeded, handle accordingly
        const connectedAccount = event.data.object as any;
  
        console.log( connectedAccount );
  
        if ( !connectedAccount.metadata ) return res.json({ received: true });
  
        if ( connectedAccount.metadata.type && connectedAccount.metadata.userId ) {
          let response = await stripeHandler.StripeWebHooks.updateConnectAccount( connectedAccount.id, connectedAccount.metadata.userId, connectedAccount.metadata.type );
          
          return res.status( response.status ).send( response.message );
        }
  
        break;
      // Handle other event types as needed
    }
  
    res.json({ received: true });
});

export default router;