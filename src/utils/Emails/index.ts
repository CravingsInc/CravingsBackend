import { Resend } from 'resend';
import { Utils } from "../Utils";
import { reservation, ReservationProps, contact, ContactProps, passwordChange, PasswordChangeProps, TeamMemberInviteProps, teamMemberInvite } from "./email-templates";
import { TicketBuyProps, ticketBuy } from "./email-templates/ticketBuy";
import { waitList, WaitlistProps } from './email-templates/waitlist';

export enum EmailTemplates {
    RESERVATION,
    CONTACT,
    WAITLIST,
    PASSWORD_CHANGE,
    TICKET_BUY,
    TEAM_MEMBER_INVITE
}

type EmailTemplatesOpt = ReservationProps | ContactProps | PasswordChangeProps | TicketBuyProps | WaitlistProps | TeamMemberInviteProps;

const formatMail = (mail: string, opt: { [key: string]: string | number }) => {
    for (let key in opt) mail = mail.replaceAll(`{{${key}}}`, opt[key] + "")
    return mail;
}

const getEmailTemplates = (template: EmailTemplates, opt: EmailTemplatesOpt) => {
    switch (template) {
        case EmailTemplates.RESERVATION:
            return formatMail(reservation, opt);
        case EmailTemplates.CONTACT:
            return formatMail(contact, opt);
        case EmailTemplates.WAITLIST:
            return formatMail(waitList, opt);
        case EmailTemplates.PASSWORD_CHANGE:
            return formatMail(passwordChange, opt);
        case EmailTemplates.TICKET_BUY:
            return ticketBuy(opt as TicketBuyProps);
        case EmailTemplates.TEAM_MEMBER_INVITE:
            return formatMail(teamMemberInvite, opt);

        // Add more cases as needed for other email templates
        default: return "";
    }
}

export class Mailer {

    private static _mailer: Mailer;

    private mailer = new Resend(Utils.AppConfig.BasicConfig.RESEND_API_KEY);

    private Constructor() { }

    static getMailer() {
        if (Mailer._mailer) return Mailer._mailer;

        Mailer._mailer = new Mailer();

        return Mailer._mailer;
    }

    getGmailCredentials() {
        return Utils.AppConfig.BasicConfig.RESEND_API_KEY;
    }

    async sendEmail(from: string, to: string, subject: string, html: string) {
        try {
            await this.mailer.emails.send({ from, to, subject, html });
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async sendContactEmail(opt: ContactProps) {
        return await this.sendEmail(
            'Eventrix <outreach@eventrix.ai>',
            `outreach@eventrix.ai${opt.organizer === "Yes" ? '' : `, ${opt.email}`}`,
            `Eventrix ${opt.waitList === "Yes" ? 'New WaitList' : 'Contact'} by ${opt.first_name}`,
            getEmailTemplates(EmailTemplates.CONTACT, opt)
        )
    }

    async sendWaitlistEmail(opt: ContactProps) {
        await this.sendContactEmail(opt);

        return await this.sendEmail(
            'Eventrix <outreach@eventrix.ai>',
            opt.email,
            `Thank You ${opt.first_name}, For Joining Waitlist`,
            getEmailTemplates(EmailTemplates.WAITLIST, { orgName: opt.first_name })
        )
    }

    async sendReservationEmail(opt: ReservationProps) {
        return await this.sendEmail(
            'Eventrix <reservation@eventrix.ai>',
            `${opt.email}, outreach@eventrix.ai`,
            `Eventrix Event Reservation by ${opt.first_name}`,
            getEmailTemplates(EmailTemplates.RESERVATION, opt)
        )
    }

    async sendPasswordChangeEmail(opt: PasswordChangeProps) {
        return await this.sendEmail(
            'Eventrix <dont-reply@eventrix.ai>',
            `${opt.email}`,
            `${opt.username} you requested a password change on Eventrix`,
            getEmailTemplates(EmailTemplates.PASSWORD_CHANGE, opt)
        )
    }

    async sendTeamMemberInviteEmail(opt: TeamMemberInviteProps) {
        return await this.sendEmail(
            'Eventrix <dont-reply@eventrix.ai>',
            `${opt.email}`,
            `${opt.username} you were invite to join ${opt.orgName} team`,
            getEmailTemplates(EmailTemplates.TEAM_MEMBER_INVITE, opt)
        )
    }

    async sendTicketBuyConfirmation(opt: TicketBuyProps) {
        return await this.sendEmail(
            'Eventrix <dont-reply@eventrix.ai>',
            `${opt.email}`,
            `Eventrix: ${opt.eventName} Ticket Confirmation`,
            getEmailTemplates(EmailTemplates.TICKET_BUY, opt)
        )
    }
}
