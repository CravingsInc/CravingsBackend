import { reservation, ReservationProps, contact, ContactProps, passwordChange, PasswordChangeProps } from "./email-templates";
import nodemailer from "nodemailer";

export enum EmailTemplates {
    RESERVATION,
    CONTACT,
    PASSWORD_CHANGE
}

type EmailTemplatesOpt = ReservationProps | ContactProps | PasswordChangeProps;

const formatMail = ( mail: string, opt : { [ key: string ]: string | number } ) => {
    for ( let key in opt ) mail = mail.replaceAll(`{{${key}}}`, opt[key] + "" )
    return mail;
}

const getEmailTemplates = ( template: EmailTemplates, opt: EmailTemplatesOpt ) => {
    switch ( template ) {
        case EmailTemplates.RESERVATION:
            return formatMail( reservation, opt );
        case EmailTemplates.CONTACT:
            return formatMail( contact, opt );
        case EmailTemplates.PASSWORD_CHANGE:
            return formatMail( passwordChange, opt );
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

    static async sendEmail( to: string, subject: string, text: string | undefined, html: string | undefined, sender?: string ) {
        try {
            await this.#mailer.sendMail({ from: "Cravings Inc", to, subject, text, html, sender });
            return true;
        }catch(e) {
            console.log(e);
            return false;
        }
    }

    static async sendContactEmail( opt: ContactProps ) {
        return await this.sendEmail( 
            `${opt.email}, outreach@cravingsinc.us`,
            `CravingsInc Contact by ${opt.first_name}`,
            undefined, 
            getEmailTemplates(EmailTemplates.CONTACT, opt)
        )
    }

    static async sendReservationEmail( opt: ReservationProps) {
        return await this.sendEmail( 
            `${opt.email}, outreach@cravingsinc.us`,
            `CravingsInc Event Reservation by ${opt.first_name}`,
            undefined, 
            getEmailTemplates(EmailTemplates.RESERVATION, opt)
        )
    }

    static async sendPasswordChangeEmail( opt: PasswordChangeProps ) {
        return await this.sendEmail( 
            `${opt.email}`,
            `${opt.username} you requested a password change on CravingsInc`,
            undefined, 
            getEmailTemplates(EmailTemplates.PASSWORD_CHANGE, opt),
            "dont-reply@cravingsinc.us"
        )
    }
}
