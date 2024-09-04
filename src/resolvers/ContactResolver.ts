import { Resolver, Arg, Query, Mutation } from "type-graphql";
import * as models from "../models";
import { Utils } from "../utils";

@Resolver()
export class ContactResolver {
    @Query( () => String )
    async makeReservation( @Arg("reservationInput", () => models.ReservationInput) opt: models.ReservationInput ) {
        await Utils.Mailer.sendReservationEmail(opt)

        return "Email Sent"
    }

    @Query( () => String )
    async makeContact( @Arg("contactInput", () => models.ContactInput) opt : models.ContactInput ) {
        await Utils.Mailer.sendContactEmail({...opt, organizer: opt.organizer ? "Yes" : "No" });

        return "Contact Sent";
    }

    @Mutation( () => String )
    async joinWaitlist( @Arg("waitlistInput", () => models.WaitListInput ) opt: models.WaitListInput ) {
        let waitListExist = await models.OrganizerWaitlist.findOne({
            where: { firstName: opt.first_name, lastName: opt.last_name, email: opt.email, phoneNumber: opt.phone_number }
        });

        if ( waitListExist ) return new Utils.CustomError("Waitlist already exists");

        let waitList = await models.OrganizerWaitlist.create({ 
            firstName: opt.first_name, 
            lastName: opt.last_name, 
            email: opt.email, 
            phoneNumber: opt.phone_number 
        }).save();

        await Utils.Mailer.sendContactEmail({
            ...opt, organizer: "Yes", message: "SYSTEM: Needs to be added to wait list and emailed", waitList: "Yes"
        });

        return "Successfully added to wait list";
    }
}
