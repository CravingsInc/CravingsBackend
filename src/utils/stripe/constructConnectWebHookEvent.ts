import { stripe } from "./stripe";
import { Utils } from "../Utils";

export const constructConnectWebHookEvent = ( body: any, signature: string ) => {
    const event = stripe.webhooks.constructEvent(
        body,
        signature,
        Utils.AppConfig.BasicConfig.STRIPE_CONNECT_WEBHOOK_SECRET as string
    );

    return event;
}
