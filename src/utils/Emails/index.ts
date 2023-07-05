import { reservation, ReservationProps } from "./email-templates";
import nodemailer from "nodemailer";

export enum EmailTemplates {
    RESERVATION
}

type EmailTemplatesOpt = ReservationProps;

const formatMail = ( mail: string, opt : { [ key: string ]: string | number } ) => {
    for ( let key in opt ) mail = mail.replaceAll(`{{${key}}}`, opt[key] + "" )
    return mail;
}

const getEmailTemplates = ( template: EmailTemplates, opt: EmailTemplatesOpt ) => {
    switch ( template ) {
        case EmailTemplates.RESERVATION:
            return formatMail( reservation, opt ); 
        default: return "";
    }
}

export class Mailer {
    static #mailer = nodemailer.createTransport({
        service: "gmail",
        auth: Mailer.getGmailCredentials()
    });

    static getGmailCredentials() {
        return {
            user: "outreach@cravingsinc.us",
            pass: process.env.gmailPWD || ""
        }
    }

    static sendEmail( to: string, subject: string, text: string | undefined, html: string | undefined ) {
        try {
            this.#mailer.sendMail({ from: "Cravings Inc", to, subject, text, html });
        }catch(e) {
            console.log(e);
        }
    }

    static sendReservationEmail( opt: ReservationProps) {
        this.sendEmail( 
            `${opt.email}, outreach@cravingsinc.us`,
            `CravingsInc Event Reservation by ${opt.first_name}`,
            undefined, 
            getEmailTemplates(EmailTemplates.RESERVATION, opt)
        )
    }
}
