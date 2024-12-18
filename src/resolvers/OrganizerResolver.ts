import { Resolver, Mutation, Query, Arg } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class OrganizerResolver {
    @Mutation( returns => String )
    async CreateOrganizerAccount( @Arg("orgName") orgName: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let organizer : models.Organizers;

        if ( orgName.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        try {
            organizer = await models.Organizers.create({
                orgName: orgName,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) {
            console.log(e);
            throw new Utils.CustomError("Organizer Name Already Exist");
        }

        if ( organizer ) {
            try {
                organizer.stripeConnectId = ( await stripeHandler.createConnectAccount(email, organizer.id ) ).id;
                await organizer.save();
            }catch(e) {
                console.log(e);

                await organizer.remove();
                throw new Utils.CustomError("Problem Creating Organizer Account");
            }

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(organizer.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER
                },
                Utils.SECRET_KEY,
                { expiresIn: "2w" }
            )
        }
    }

    @Mutation( returns => String ) 
    async OrganizerLogIn( @Arg("orgName") orgName: string, @Arg('email') email: string, @Arg("password") password: string ) {
        let organizer = await models.Organizers.loginOrganizer( orgName, email );

        if ( organizer ) {
            if ( await bcrypt.compare(password, organizer.password) ) {
                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(organizer.id),
                        type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER,
                        org: organizer.orgName
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                )
            }

            throw new Utils.CustomError("Invalid credentials. Please try again");
        }

        let orgMember = await models.Organizers.loginOrganizersMembers( orgName, email );

        if ( orgMember ) {
            if ( await bcrypt.compare( password, orgMember.password ) ) {

                // If they haven't accepted but logged in, then they want to be apart of the team.
                if ( orgMember.accepted ) orgMember.accepted = true;

                await orgMember.save();

                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(orgMember.id),
                        type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                        org: orgMember.organizer.orgName
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                )
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again");
    }

    @Query( returns => models.Organizers )
    async getOrganizerProfile( @Arg("token") token: string ) {
        return await Utils.getOrgFromOrgOrMemberJsWebToken(token);
    }

    @Mutation( returns => String )
    async getOrganizerPage( @Arg('organizerId') organizerId: string, @Arg("userToken", { nullable: true }) userToken?: string ) {
        let user = userToken ? await Utils.getUserFromJsWebToken(userToken) : null;

        let organizer = await models.Organizers.findOneBy({ id: organizerId });

        if ( !organizer ) throw new Utils.CustomError("Invalid organizer. Please try again.")

        await models.OrganizerPageVisit.create({
            guest: user == null,
            user,
            organizer
        }).save();

        return {
            id: organizer.id,
            orgName: organizer.orgName,
            profilePicture: organizer.profilePicture,
            banner: organizer.banner,
            followers: await models.OrganizersFollowers.count({ where: { organizer: { id: organizer.id } } }),
            events: await Promise.all(
                (
                    await models.Events.find({ where: { organizer: { id: organizer.id } } })
                ).map( async e => {
                    let prices: ( number | null )[] = [];

                    try {
                        prices = (await stripeHandler.getEventTicketPrices(e.productId, organizer!.stripeConnectId ))?.data.map(v => v.unit_amount);
                    }catch(e) { prices = [0]; }
    
                    let maxPrice, minPrice = 0;
    
                    if (prices && prices.length > 0) {
                        maxPrice = Math.max(...prices as number[]) / 100;
                        minPrice = Math.min(...prices as number[]) / 100;
                    }
    
                    return {
                        id: e.id,
                        name: e.title,
                        description: e.description,
                        banner: e.banner,
                        costRange: prices.length > 1 ? `$${minPrice}-$${maxPrice}` : `$${minPrice}`,
                        eventDate: e.eventDate,
                        location: {
                            latitude: e.latitude,
                            longitude: e.longitude,
                            location: e.location
                        }
                    }
                })
            )
        }

    }

    @Mutation( () => models.OrganizerSettingsMemberUpdateResponse)
    async saveOrganizerMemberSettings( @Arg('token') token: string, @Arg('args', () => models.OrganizerMemberSettingsUpdateInput ) args: models.OrganizerMemberSettingsUpdateInput ) {
        let member = await Utils.getOrganizerMemberFromJsWebToken( token );

        let memberResponse = {
            id: member.id,
            name: member.name,
            email: member.email,
            phoneNumber: member.phoneNumber,
            profilePicture: member.profilePicture
        }

        if ( args.name ) {
            member.name = args.name;
        }

        if ( args.email ) {
            member.email = args.email;
        }

        if ( args.phoneNumber ) {
            member.phoneNumber = args.phoneNumber;
        }

        if ( args.profilePicture ) {
            member.profilePicture = args.profilePicture;
        }

        await member.save();

        memberResponse = {
            id: member.id,
            name: member.name,
            email: member.email,
            phoneNumber: member.phoneNumber,
            profilePicture: member.profilePicture
        }


        return { response: "Successfully Updated", member: memberResponse }
    }

    @Mutation( () => models.OrganizerSettingsUpdateResponse)
    async saveOrganizerSettings( @Arg('token') token: string, @Arg('args', () => models.OrganizerSettingsUpdateInput ) args: models.OrganizerSettingsUpdateInput ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let orgResponse = {
            id: org.id,
            banner: org.banner,
            orgName: org.orgName,
            email: org.email,
            phoneNumber: org.phoneNumber,
            profilePicture: org.profilePicture,
            location: org.location
        }

        if ( args.orgName && args.orgName !== org.orgName ) {

            let orgExists = await models.Organizers.findOneBy({ orgName: args.orgName });
                
            if ( orgExists ) return { 
                response: "Unsuccessfull",
                error: {
                    message: "Organization name already exists. Please choose a different name.",
                    code: 404
                }, 
                organizer: orgResponse
            }

            org.orgName = args.orgName;
        }

        if ( args.email ) {
            org.email = args.email;
        }

        if ( args.phoneNumber ) {
            org.phoneNumber = args.phoneNumber;
        }

        if ( args.location ) {
            org.location = args.location;
        }

        if ( args.profilePicture ) {
            org.profilePicture = args.profilePicture;
        }

        if ( args.banner ) {
            org.banner = args.banner;
        }

        await org.save();

        orgResponse = {
            id: org.id,
            banner: org.banner,
            orgName: org.orgName,
            email: org.email,
            phoneNumber: org.phoneNumber,
            profilePicture: org.profilePicture,
            location: org.location
        }


        return { response: "Successfully Updated", organizer: orgResponse }
    }

    @Query( () => models.OrganizerSettingsPageResponse )
    async getOrganizerSettingsPage( @Arg('token') token: string ) {
        let org: models.Organizers;
        let orgMember: models.OrganizerMembers | null = null;
        let isOrg: boolean;

        try {
            org = await Utils.getOrganizerFromJsWebToken( token );
            isOrg = true;
        }catch(e) {
            orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );
            isOrg = false;
            org = orgMember.organizer;
        }

        return {
            isOrg,
            user: orgMember ? {
                name: orgMember.name,
                phoneNumber: orgMember.phoneNumber,
                profilePicture: orgMember.profilePicture,
                title: orgMember.title,
                email: orgMember.email,
                id: orgMember.id,
            }: null,
            organizer: {
                banner: org.banner,
                orgName: org.orgName,
                email: org.email,
                phoneNumber: org.phoneNumber,
                location: org.location,
                profilePicture: org.profilePicture,
                id: org.id
            },
            teams: [
                {
                    name: org.orgName,
                    email: org.email,
                    type: "Organizer",
                    joinedDate: org.createdDate,
                    id: org.id,
                    profilePicture: org.profilePicture
                },

                ...(
                    await models.OrganizerMembers.find({
                      where: { organizer: { id: org.id } },
                      relations: ['organizer']
                    })
                ).map(member => ({
                    name: member.name,
                    email: member.email,
                    type: member.title,
                    joinedDate: member.dateJoined,
                    id: member.id,
                    profilePicture: member.profilePicture
                }))
            ]
        }
    }

    @Mutation( () => String )
    async changeOrganizerPassword( @Arg('token') token: string ) {
        let organizer = await Utils.getOrganizerFromJsWebToken(token);

        let passwordChange = await models.OrganizerPasswordChange.create({
            organizer
        }).save();

        let link_to_open = `${Utils.getCravingsWebUrl()}/org/change-password/org/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(organizer.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER,
                    command: "change-password",
                    pwc: passwordChange.id
                },
                Utils.SECRET_KEY,
                { expiresIn: 10 * 60 } // Expires in 10 minutes
            )
        }`;

        let sentSuccessfully = await Utils.Mailer.sendPasswordChangeEmail({ link_to_open, email: organizer.email, username: organizer.orgName });

        if ( !sentSuccessfully ) await passwordChange.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully ? "Password change email sent successfully" : "Problem sending password change email";
    }

    @Query( () => String )
    async verifyOrganizerPasswordChangeToken( @Arg('token') token: string ) {
        let pwc = await Utils.verifyOrgPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Token is not valid";

        return "Token is valid"
    }

    @Query( () => String )
    async confirmOrgPasswordChange( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {
        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return new Utils.CustomError("Can't change your password");

        if ( newPassword !== confirmNewPassword ) return new Utils.CustomError("Can't change your password");

        let pwc = await Utils.verifyOrgPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return new Utils.CustomError("Can't change password");

        let org = pwc.organizer;

        org.password = await bcrypt.hash(newPassword, 12);

        pwc.tokenUsed = true;

        await pwc.save();
        await org.save();

        return "Successfully changed your password";
    }

    @Mutation( () => String )
    async changeOrganizerMemberPassword( @Arg('token') token: string ) {
        let member = await Utils.getOrganizerMemberFromJsWebToken(token);

        let passwordChange = await models.OrganizerMemberPasswordChange.create({
            member
        }).save();

        let link_to_open = `${Utils.getCravingsWebUrl()}/org/change-password/member/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(member.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                    command: "change-password",
                    pwc: passwordChange.id
                },
                Utils.SECRET_KEY,
                { expiresIn: 10 * 60 } // Expires in 10 minutes
            )
        }`;

        let sentSuccessfully = await Utils.Mailer.sendPasswordChangeEmail({ link_to_open, email: member.email, username: member.name });

        if ( !sentSuccessfully ) await passwordChange.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully ? "Password change email sent successfully" : "Problem sending password change email";
    }

    @Query( () => String )
    async verifyOrganizerMemberPasswordChangeToken( @Arg('token') token: string ) {
        let pwc = await Utils.verifyOrgMemberPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return "Token is not valid";

        return "Token is valid"
    }

    @Query( () => String )
    async confirmOrganizerMemberPasswordChange( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {
        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return new Utils.CustomError("Can't change your password");

        if ( newPassword !== confirmNewPassword ) return new Utils.CustomError("Can't change your password");

        let pwc = await Utils.verifyOrgMemberPasswordChangeToken(token);

        if ( pwc.tokenUsed ) return new Utils.CustomError("Can't change password");

        let member = pwc.member;

        member.password = await bcrypt.hash(newPassword, 12);

        pwc.tokenUsed = true;

        await pwc.save();
        await member.save();

        return "Successfully changed your password";
    }

    @Mutation( () =>  models.Events )
    async createEvent( @Arg('token') token: string, @Arg('title') title: string, @Arg('description') description: string ) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let event = await models.Events.create({
            title,
            description,
            banner: "",
            organizer: { id: org.id }
        }).save();

        let stripeEvent = await stripeHandler.createEvent(org.stripeConnectId, org.id, event.id, title );

        event.productId = stripeEvent.id;

        await event.save();

        return event;
    }

    @Mutation( () => models.Events )
    async repeatEvent( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('ticket') ticket?: boolean ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let parentEvent = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }, relations: ['parent', 'prices'] });

        if ( !parentEvent ) return new Utils.CustomError("Event Couldn't be repeated, please try again.");

        let event = await models.Events.create({
            title: parentEvent.title,
            description: parentEvent.description,
            banner: parentEvent.banner,
            latitude: parentEvent.latitude,
            longitude: parentEvent.longitude,
            location: parentEvent.location,
            ticketType: parentEvent.ticketType,
            organizer: { id: org.id },
            // If event alread has a parent we will use that parent, else we will make that event the parent.
            parent: { id: parentEvent.parent ? parentEvent.parent.id : parentEvent.id },
        }).save();

        let stripeEvent = await stripeHandler.createEvent( org.stripeConnectId, org.id, event.id, event.title );

        event.productId = stripeEvent.id;

        if ( ticket ) {
            for ( let price of parentEvent.prices ) {
                let eventTicket = await models.EventTickets.create({
                    title: price.title,
                    description: price.description,
                    event,
                    amount: price.amount
                });

                try {
                    eventTicket.save();

                    let stripeTicket = await stripeHandler.createEventPrice( org.stripeConnectId, org.id, event.id, event.productId, price.amount, price.currency );
                    
                    eventTicket.priceId = stripeTicket.id;
        
                    await eventTicket.save();
                }catch(err) {
                    await eventTicket.remove(); // want to self clean database
                }
            }
        }

        await event.save();
        
        return event;
    }

    @Mutation( () => String )
    async modifyEvent( @Arg('token') token: string, @Arg('args', () =>  models.ModifyEventInputType ) args: models.ModifyEventInputType ) {
        let organizer = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: args.id, organizer: { id: organizer.id } } });

        if ( !event ) return new Utils.CustomError("Event does not exist");

        if ( args.title != null  ) event.title = args.title;

        if ( args.description != null  ) event.description = args.description;

        if ( args.eventDate != null  ) event.eventDate = args.eventDate;

        if ( args.endDate != null  ) event.endEventDate = args.endDate;

        if ( args.visible != null  ) event.visible = args.visible;

        if ( args.location != null  ) {
            let loc = await Utils.googleMapsService.getLatitudeLongitude(args.location);

            event.location = args.location;
            event.latitude = loc.lat;
            event.longitude = loc.lng;
        }

        if ( args.banner ) event.banner = args.banner;

        await event.save();

        return "Modified Properly";
    }

    @Mutation( () => String )
    async createEventTicket( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('title') title: string, @Arg('amount') amount: number, @Arg('currency', { nullable: true, defaultValue: 'usd' }) currency: string, @Arg('description', { nullable: true }) description: string ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.create({
            title,
            description,
            event,
            amount,
            currency
        }).save();

        try {
            let stripeTicket = await stripeHandler.createEventPrice( org.stripeConnectId, org.id, event.id, event.productId, amount, currency );
            
            eventTicket.priceId = stripeTicket.id;

            await eventTicket.save();
        }catch(err) {
            await eventTicket.remove(); // want to self clean database

            return new Utils.CustomError("Problem creating event ticket")
        }

        return "Event Ticket created successfully";
    }

    @Mutation( () => String ) 
    async modifyEventTicketPrice( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('args', () => models.ModifyEventTicketPriceInputType ) args: models.ModifyEventTicketPriceInputType ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.findOne({ where: { id: args.id, event: { id: eventId }} });

        if ( !eventTicket ) return new Utils.CustomError("Problem changing event ticket");

        try {
            let newStripeTicket = await stripeHandler.modifyEventPrice( org.stripeConnectId, org.id, eventId, event.productId, eventTicket.priceId, args.amount, args.currency );

            eventTicket.priceId = newStripeTicket.id;
            eventTicket.amount = args.amount;
            eventTicket.currency = args.currency || "usd";
            await eventTicket.save();
        }catch( err ) {
            console.log( err );
            return new Utils.CustomError("Problem modifying event ticket");
        }

        return "Event Ticket Price modified successfully";
    }

    @Mutation( () => String )
    async modifyEventTicket( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('args', () => models.ModifyEventTicketInputType ) args: models.ModifyEventTicketInputType ) {
        let org = await Utils.getOrganizerFromJsWebToken( token );

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } }});

        if ( !event ) return new Utils.CustomError("Event does not exist");

        let eventTicket = await models.EventTickets.findOne({ where: { id: args.id, event: { id: eventId }} });

        if ( !eventTicket ) return new Utils.CustomError("Problem changing event ticket");

        if ( args.title != null  ) eventTicket.title = args.title;

        if ( args.description != null  ) eventTicket.description = args.description;

        if ( args.totalTicketAvailable != null  ) eventTicket.totalTicketAvailable = args.totalTicketAvailable;

        await eventTicket.save();

        return "Event Ticket updated successfully";
    }

    @Mutation( () => String )
    async removeTeamMember( @Arg('token') token: string, @Arg('teamMemberId') teamMemberId: string ) {
        let org: models.Organizers | null = null;
        let orgMember: models.OrganizerMembers | null = null;

        try {
            org = await Utils.getOrganizerFromJsWebToken( token );
        }catch {
            orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );

            if ( orgMember.title !== "Admin" ) return new Utils.CustomError("Do not have permission to access this") 
        }

        let teamMember = await models.OrganizerMembers.findOne({ where: { id: teamMemberId, organizer: { id: org ? org.id : orgMember?.organizer.id } } });

        if ( teamMember ) await teamMember.remove();

        return "Successfully remove organizer member";
    }

    @Mutation( () => String ) 
    async updateTeamMemberTitle( @Arg('token') token: string, @Arg('teamMemberId') teamMemberId: string, @Arg('newTitle') newTitle: 'Admin' | "Member" | "Guest" ) {
        let org: models.Organizers | null = null;
        let orgMember: models.OrganizerMembers | null = null;

        try {
            org = await Utils.getOrganizerFromJsWebToken( token );
        }catch {
            orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );

            if ( orgMember.title !== "Admin" ) return new Utils.CustomError("Do not have permission to access this") 
        }

        let teamMember = await models.OrganizerMembers.findOne({ where: { id: teamMemberId, organizer: { id: org ? org.id : orgMember?.organizer.id } } });

        if ( [ 'Admin', "Member", "Guest" ].includes(newTitle) && teamMember ) {
            teamMember.title = newTitle;
            await teamMember.save();

            return "Successfully change team members title";
        }

        return new Utils.CustomError("Title isn't valid")
    }

    @Mutation( () => String )
    async addTeamMember(@Arg('token') token: string, @Arg('args', () => models.CreateOrganizerMemberInput ) args: models.CreateOrganizerMemberInput ){

        let org: models.Organizers | null = null;
        let orgMember: models.OrganizerMembers | null = null;
        
        let newMember: models.OrganizerMembers | null = null;

        try {
            org = await Utils.getOrganizerFromJsWebToken( token );
        }catch {
            orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );
        }

        let localMemberCreation = async () => await models.OrganizerMembers.create({
            name: args.name,
            email: args.email,
            phoneNumber: args.phoneNumber,
            title: args.role,
            password: await bcrypt.hash('', 12),
            accepted: false,
            organizer: { id: org ? org.id : orgMember?.id }
        }).save();

        let emailProps = {
            link_to_open: '',
            invitorName: '',
            orgName: '',
            email: '',
            username: ''
        }

        if ( org ) {
            newMember = await localMemberCreation();
            emailProps.orgName = org.orgName;
            emailProps.invitorName = org.orgName;
        }

        else if ( orgMember ) {

            if ( orgMember.title === `Admin` ) newMember = await localMemberCreation();

            emailProps.orgName = orgMember.organizer.orgName;
            emailProps.invitorName = orgMember.name;

        }else {
            return new Utils.CustomError("Unauthorized access");
        }

        emailProps.link_to_open = `${Utils.getCravingsWebUrl()}/org/accept-invite/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(newMember!.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                    command: "invite-team-member",
                },
                Utils.SECRET_KEY,
                { expiresIn: ( ( 60 * 60 ) * 24 ) * 7 } // Expires in 1 week
            )
        }`;

        emailProps.email = newMember!.email;
        emailProps.username = newMember!.name;

        let sentSuccessfully = await Utils.Mailer.sendTeamMemberInviteEmail(emailProps);

        if ( !sentSuccessfully ) await newMember!.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully && newMember ? newMember.id : new Utils.CustomError("Problem sending team member invitation");
    }

    @Query( () => String )
    async resendOrganizerTeamInviteToken( @Arg('token') token: string, @Arg('orgTeamId') orgTeamId: string ) {
        let org: models.Organizers | null = null;
        let orgMember: models.OrganizerMembers | null = null;
        
        let newMember: models.OrganizerMembers | null = null;

        try {
            org = await Utils.getOrganizerFromJsWebToken( token );
        }catch {
            orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );
        }

        let emailProps = {
            link_to_open: '',
            invitorName: '',
            orgName: '',
            email: '',
            username: ''
        }

        if ( org ) {
            newMember = await models.OrganizerMembers.findOneBy({ id: orgTeamId });
            emailProps.orgName = org.orgName;
            emailProps.invitorName = org.orgName;
        }

        else if ( orgMember ) {

            if ( orgMember.title === `Admin` ) newMember = await models.OrganizerMembers.findOneBy({ id: orgTeamId });

            emailProps.orgName = orgMember.organizer.orgName;
            emailProps.invitorName = orgMember.name;

        }else {
            return new Utils.CustomError("Unauthorized access");
        }

        emailProps.link_to_open = `${Utils.getCravingsWebUrl()}/org/accept-invite/${
            jwt.sign(
                {
                    ...await Utils.generateJsWebToken(newMember!.id),
                    type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                    command: "invite-team-member",
                },
                Utils.SECRET_KEY,
                { expiresIn: ( ( 60 * 60 ) * 24 ) * 7 } // Expires in 1 week
            )
        }`;

        emailProps.email = newMember!.email;
        emailProps.username = newMember!.name;

        let sentSuccessfully = await Utils.Mailer.sendTeamMemberInviteEmail(emailProps);

        if ( !sentSuccessfully ) await newMember!.remove(); // We don't want to overload database creating unclose password changes

        return sentSuccessfully ? "Re-invitation email sent successfully" : "Re-invitation email sent successfully";
    }

    @Query( () => String )
    async verifyOrganizerTeamInviteToken( @Arg('token') token: string ) {
        let teamMember = await Utils.verifyOrgTeamMemberInviteToken(token);

        if ( teamMember.accepted ) return "Invitation Already Accepted";

        return "Token is valid";
    }

    @Query( () => String )
    async confirmOrganizerTeamMemberAddition( @Arg('token') token: string, @Arg('newPassword') newPassword: string, @Arg('confirmNewPassword') confirmNewPassword: string ) {

        if ( newPassword.length < 1 || confirmNewPassword.length < 1 ) return "Can't add you to team";

        if ( newPassword !== confirmNewPassword ) return "Can't add you to team";

        let teamMember = await Utils.verifyOrgTeamMemberInviteToken(token);

        if ( teamMember.accepted ) return jwt.sign(
            {
                ...await Utils.generateJsWebToken(teamMember.id),
                type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                org: teamMember.organizer.orgName
            },
            Utils.SECRET_KEY,
            { expiresIn: "2w" }
        )

        teamMember.accepted = true;
        teamMember.password = await bcrypt.hash(newPassword, 12)

        return jwt.sign(
            {
                ...await Utils.generateJsWebToken(teamMember.id),
                type: Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS,
                org: teamMember.organizer.orgName
            },
            Utils.SECRET_KEY,
            { expiresIn: "2w" }
        )
    }
}
