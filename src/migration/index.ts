//#region Imports

// ENV variables
import "reflect-metadata";
require('dotenv').config()

// Utils
import { stripeHandler, Utils } from '../utils';

// Database
import { createConnection } from "typeorm";
import migrationData from './migration.json';
import * as models from '../models';

// Stripe
import Stripe from "stripe";
import { stripe } from "../utils/stripe";

//#region Clear Database
const clearAll = async () => {
    await models.Users.clear();
    await models.Organizers.clear();
    await models.SiteHistory.clear();
}

//#region Users

const createUsers = async (): Promise<string[]> => {
    let usersIds: string[] = [];

    for ( let testUser of migrationData.users ) {
        let user = await models.Users.create({
            username: testUser.username,
            email: testUser.email,
            password: testUser.password,
            profilePicture: testUser.profilePicture,
            phoneNumber: testUser.phoneNumber,
            stripeCustomerId: testUser.stripeCustomerId,
            searchMilesRadius: 50,
            notificationUpdate: true,
            notificationNewFollower: true
        }).save();

        usersIds.push( user.id );
    }

    return usersIds;
}

const userRandomFollow = async ( userIds: string[], totalFollowers: number = 3 ): Promise<{ [ x: string ]: string[] }> => {
    let followersIds: {
        [ x: string ] : string[]
    } = {};

    for ( let userId of userIds ) {

        followersIds[ userId ] = [];

        for ( let j = 0; j < totalFollowers; j++ ) {
            let followerId = userIds[ Math.floor( Math.random() * userIds.length ) ];

            let alreadyFollowing = await models.UserFollowers.findOneBy({ user: { id: userId }, following: { id: followerId } });

            if ( !alreadyFollowing ) {
                await models.UserFollowers.create({
                    user: { id: userId },
                    following: { id: followerId }
                }).save();

                followersIds[ userId ].push( followerId );
            }

        }
    }

    return followersIds;
}

//#region Organizers

const createOrganizer = async (): Promise<{ id: string, stripeAccount: string }[]> => {
    let orgIds: { id: string, stripeAccount: string }[] = [];

    for ( let testOrganizer of migrationData.organizers ) {
        let organizer = await models.Organizers.create({
            orgName: testOrganizer.orgName,
            email: testOrganizer.email,
            password: testOrganizer.password,
            profilePicture: testOrganizer.profilePicture,
            phoneNumber: testOrganizer.phoneNumber,
            stripeConnectId: testOrganizer.stripeConnectId,
            banner: testOrganizer.banner,
            stripeAccountVerified: true,
            location: testOrganizer.location
        }).save();

        orgIds.push({ id: organizer.id, stripeAccount: testOrganizer.stripeConnectId });
    }

    return orgIds;
}

//#region Events

const createOrganizerEvents = async ( orgs: { id: string, stripeAccount: string }[], totalEvent: number = 4 ) => {
    let orgsEventsIds: {
        [ x: string ]: string[];
    } = {};

    for ( let org of orgs ) {

        const randomDate = Date.now() + Math.floor( Math.random() * 1e10 ); // Future timestamp
        const endDate = randomDate + Math.floor( Math.random() * 1e6 ); // End after a random date;

        for ( let i = 0; i < totalEvent; i++ ) {
            let event = migrationData.events[ Math.floor( Math.random() * migrationData.events.length ) ];
            
            let existingProducts: { data: Stripe.Product[] };

            try {
                existingProducts = await stripe.products.list({
                    stripeAccount: org.stripeAccount
                });
            }catch( e ) {
                existingProducts = { data: [] };
            }
            
            // allows for no duplicate of product just to keep stripe test clean as possible
            const existingProduct = existingProducts.data.find(
                product => product.metadata?.eventIdentifier === `${org.id}-${event.title.replaceAll(" ", "-")}`
            );

            let eventSaved = await models.Events.findOneBy({ organizer: { id: org.id }, title: event.title });

            if ( existingProduct ) {

                if ( !eventSaved ) {
                    eventSaved = await models.Events.create({
                        title: event.title,
                        description: event.description.join('\n\n'),
                        eventDate: new Date(randomDate),
                        endEventDate: new Date(endDate),
                        organizer: { id: org.id },
                        banner: event.banner,
                        visible: true,
                        location: event.location,
                        productId: existingProduct.id
                    }).save();

                    orgsEventsIds[ org.id ] = orgsEventsIds[ org.id ] || [];
                    orgsEventsIds[ org.id ].push( eventSaved.id );
                }
            }else {
                if ( !eventSaved ) {
                    eventSaved = await models.Events.create({
                        title: event.title,
                        description: event.description.join('\n\n'),
                        eventDate: new Date(randomDate),
                        endEventDate: new Date(endDate),
                        organizer: { id: org.id },
                        banner: event.banner,
                        visible: true,
                        location: event.location
                    }).save();


                    try {
                        let stripeProduct = await stripeHandler.createEvent( org.stripeAccount, org.id, eventSaved.id, eventSaved.title, {
                            eventIdentifier: `${org.id}-${event.title.replaceAll(" ", "-")}`
                        });
    
                        eventSaved.productId = stripeProduct.id;
                        await eventSaved.save();

                        orgsEventsIds[ org.id ] = orgsEventsIds[ org.id ] || [];
                        orgsEventsIds[ org.id ].push( eventSaved.id );
                    }catch( e ) {
                        await eventSaved.remove(); // want to self clean database

                        eventSaved = null;
                    }
                }
            }

            if ( eventSaved ) {

                // Create event tickets
                for ( let price of event.tickets ) {
                    let ticket = await models.EventTickets.create({
                        title: price.title,
                        description: price.description,
                        event: { id: eventSaved.id },
                        amount: price.amount,
                        totalTicketAvailable: price.totalAvailable,
                        currency: 'usd'
                    }).save();

                    try {
                        let stripeTicket = await stripeHandler.createEventPrice( org.stripeAccount, org.id, eventSaved.id, eventSaved.productId, ticket.amount, "usd" );
                        
                        ticket.priceId = stripeTicket.id;
            
                        await ticket.save();
                    }catch(err) {
                        await ticket.remove(); // want to self clean database
                    }
                }
            }
        }
    }
}

//#region Organizer & Users

const userRandomFollowerOrganizer = async ( userIds: string[], orgIds: string[], totalFollowers: number = 3 ): Promise<{ [ x: string ]: string[] }> => {
    let followersIds: {
        [ x: string ] : string[]
    } = {};

    for ( let orgId of orgIds ) {
        
        followersIds[ orgId ] = [];

        for ( let i = 0; i < totalFollowers; i++ ) {
            let userId = userIds[ Math.floor( Math.random() * userIds.length ) ];

            let alreadyFollowing = await models.OrganizersFollowers.findOneBy({ user: { id: userId }, organizer: { id: orgId } });

            if ( !alreadyFollowing ) {
                let follower = await models.OrganizersFollowers.create({
                    user: { id: userId },
                    organizer: { id: orgId }
                }).save();

                followersIds[ orgId ].push( follower.id );
            }
        }
    }

    return followersIds;
}

const main = async () => {
    const connection = await createConnection({
        type: "sqlite",
        database: "./db.sqlite3",
        entities: ["src/models/*.ts"],
        synchronize: true,
    });

    await clearAll();

    
}

try {
    main();
}catch( e ) {
    console.error(e);
}
