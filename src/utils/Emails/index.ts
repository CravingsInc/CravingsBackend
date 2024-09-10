import { Resend } from 'resend';
import { Utils } from "../Utils";
import { reservation, ReservationProps, contact, ContactProps, passwordChange, PasswordChangeProps } from "./email-templates";
import { TicketBuyProps, ticketBuy } from "./email-templates/ticketBuy";

export enum EmailTemplates {
    RESERVATION,
    CONTACT,
    PASSWORD_CHANGE,
    TICKET_BUY
}

type EmailTemplatesOpt = ReservationProps | ContactProps | PasswordChangeProps | TicketBuyProps;

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
        case EmailTemplates.TICKET_BUY:
            return ticketBuy( opt as TicketBuyProps );
        default: return "";
    }
}

export class Mailer {
    
    private static _mailer: Mailer;

    private mailer = new Resend( Utils.AppConfig.BasicConfig.RESEND_API_KEY );

    private Constructor() {}

    static getMailer() {
        if ( Mailer._mailer ) return Mailer._mailer;

        Mailer._mailer = new Mailer();

        return Mailer._mailer;
    }

    getGmailCredentials() {
        return Utils.AppConfig.BasicConfig.RESEND_API_KEY;
    }

    async sendEmail( from: string, to: string, subject: string, html: string ) {
        try {
            await this.mailer.emails.send({ from, to, subject, html });
        }catch(e) {
            console.log(e);
            return false;
        }
    }

    async sendContactEmail( opt: ContactProps ) {
        return await this.sendEmail(
            'CravingsInc <outreach@cravingsinc.us>',
            `outreach@cravingsinc.us${ opt.organizer === "Yes" ? '': `, ${ opt.email }`}`,
            `CravingsInc ${ opt.waitList === "Yes" ? 'New WaitList' : 'Contact'} by ${opt.first_name}`,
            getEmailTemplates(EmailTemplates.CONTACT, opt)
        )
    }

    async sendReservationEmail( opt: ReservationProps) {
        return await this.sendEmail(
            'CravingsInc <reservation@cravingsinc.us>',
            `${opt.email}, outreach@cravingsinc.us`,
            `CravingsInc Event Reservation by ${opt.first_name}`,
            getEmailTemplates(EmailTemplates.RESERVATION, opt)
        )
    }

    async sendPasswordChangeEmail( opt: PasswordChangeProps ) {
        return await this.sendEmail(
            'CravingsInc <dont-reply@cravingsinc.us>',
            `${opt.email}`,
            `${opt.username} you requested a password change on CravingsInc`,
            getEmailTemplates(EmailTemplates.PASSWORD_CHANGE, opt)
        )
    }

    async sendTicketBuyConfirmation( opt: TicketBuyProps ) {
        return await this.sendEmail(
            'CravingsInc <dont-reply@cravingsinc.us>',
            `${opt.email}`,
            `CravingsInc: ${opt.eventName} Ticket Confirmation`,
            getEmailTemplates(EmailTemplates.TICKET_BUY, opt )
        )
    }
}
