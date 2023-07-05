import { Resolver, Arg, Query } from "type-graphql";
import * as models from "../models";
import { Utils } from "../utils";

@Resolver()
export class ContactResolver {
    @Query( () => String )
    async makeReservation( @Arg("reservationInput", () => models.ReservationInput) opt: models.ReservationInput ) {
        Utils.Mailer.sendReservationEmail(opt)

        return "Email Sent"
    }

    @Query( () => String )
    async makeContact( @Arg("contactInput", () => models.ContactInput) opt : models.ContactInput ) {
        Utils.Mailer.sendContactEmail(opt);

        return "Contact Sent";
    }
}
