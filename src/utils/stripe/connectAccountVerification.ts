import { stripe } from "./stripe";

export const checkAccountVerified = async ( accountId: string, checkAll: boolean = false ) => {
    try {
        const account = await stripe.accounts.retrieve( accountId );

        if ( checkAll && ( account.requirements?.currently_due?.length || 0 )  > 0 ) return false;

        if ( account.charges_enabled && account.payouts_enabled ) return true;
        
        return false;
    }catch (e) {
        return false;
    }
}
