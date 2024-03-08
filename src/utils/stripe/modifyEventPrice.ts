import { createEventPrice } from "./createEventPrice";
import { deactivateEventPrice } from "./deactivateEventPrice";

export const modifyEventPrice = async  ( stripeAccount: string, orgId: string, eventId: string, productId: string, oldPriceId: string, amount: number, currency: string = 'usd' ) => {
    await deactivateEventPrice( stripeAccount, oldPriceId ); // Deactivated Price

    return await createEventPrice( stripeAccount, orgId, eventId, productId, amount, currency );
}
