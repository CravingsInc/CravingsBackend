import "reflect-metadata";
require('dotenv').config()

import * as models from '../models';
import { Utils } from '../utils';
import migrationData from './migration.json';

import { createConnection } from "typeorm";
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

const createOrganizer = async (): Promise<string[]> => {
    let orgIds: string[] = [];

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

        orgIds.push( organizer.id );
    }

    return orgIds;
}

//#region Events

const createOrganizerEvents = async ( orgIds: string[], totalEvent: number = 4 ) => {
    let orgsEventsIds: {
        [ x: string ]: string;
    } = {};

    for ( let orgId of orgIds ) {

        let randomDate = Date.now() + Math.floor( Math.random() * 1e10 ); // Future timestamp
        const endDate = randomDate + Math.floor( Math.random() * 1e6 ); // End after a random date;

        for ( let i = 0; i < totalEvent; i++ ) {
            let event = migrationData.events[ Math.floor( Math.random() * migrationData.events.length ) ];
            
            const existingProduct = stripe.products.list({
                
                metadata: { eventIdentifier: `${orgId}-${event.title.replaceAll(" ", "-")}`} // allows for no duplicate of product just to keep stripe test clean as possible
            })
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
