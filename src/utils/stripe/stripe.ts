import Stripe from "stripe";
import { Utils } from "../Utils";

export const stripe = new Stripe(Utils.AppConfig.BasicConfig.StripeKey, {
    apiVersion: "2022-11-15",
});
