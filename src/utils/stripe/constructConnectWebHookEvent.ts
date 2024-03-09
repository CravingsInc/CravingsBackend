import { stripe } from "./stripe";
import { Utils } from "../Utils";

export const constructWebHookEvent = ( body: any, signature: string ) => {
    const event = stripe.webhooks.constructEvent(
        body,
        signature,
        Utils.AppConfig.BasicConfig.STRIPE_WEBHOOK_SECRET as string
    );

    return event;
}

export const constructWebHookConnectEvent = ( body: any, signature: string ) => {
    const event = stripe.webhooks.constructEvent(
        body,
        signature,
        Utils.AppConfig.BasicConfig.STRIPE_WEBHOOK_CONNECT_SECRET as string
    );

    return event;
}
