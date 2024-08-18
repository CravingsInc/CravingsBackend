import Stripe from "stripe";
import { Utils } from "../Utils";
import { stripe } from "./stripe";

export const getChargeById = async ( chargeId: string, verifyCompleted: boolean = false ): Promise<Stripe.Charge | Error> => {
    const charge = await stripe.charges.retrieve( chargeId );

    return verifyCompleted ? 
        charge.paid ? 
            charge : new Utils.CustomError('Charge Not Paid')
        :
        charge; 
}