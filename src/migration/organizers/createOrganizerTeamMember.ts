import { CreateOrganizerResponse } from "../types";
import migrationData from '../migration.json';
import * as models from '../../models';
import bcrypt from "bcrypt";

export const createOrganizerTeamMembers = async ( orgIds: CreateOrganizerResponse[], totalMembers: number = 5 ) => {
    let randomPossibleValues : {
        name: string;
        email: string;
        phoneNumber: string;
        password: string;
        profilePicture: string;
    }[] = [];

    let title : models.OrganizerMembersTitle[] = [ 'Admin', "Member", "Guest" ]

    let organizerTeamMembers : Record<string, string[]> = {};

    for ( let users of migrationData.users ) {
        randomPossibleValues.push({
            name: users.username,
            email: users.email,
            phoneNumber: users.phoneNumber,
            password: bcrypt.hashSync(users.password, 10),
            profilePicture: users.profilePicture
        })
    }

    for ( let orgs of migrationData.organizers ) {

        randomPossibleValues.push({
            name: orgs.orgName,
            email: orgs.email,
            phoneNumber: orgs.phoneNumber,
            password: bcrypt.hashSync(orgs.password, 10),
            profilePicture: orgs.profilePicture
        });

    }

    for ( let orgId of orgIds ) {
        console.log("\nCreating team members for organizer with ID: ", orgId.id);

        organizerTeamMembers[ orgId.id ] = [];

        for ( let i = 0; i < totalMembers; i++ ) {
            let randomUser = randomPossibleValues[ Math.floor( Math.random() * randomPossibleValues.length ) ];

            let existingMember = await models.OrganizerMembers.findOneBy({
                name: randomUser.name,
                email: randomUser.email,
                phoneNumber: randomUser.phoneNumber,
                organizer: { id: orgId.id }
            });

            if ( !existingMember ) {

                let newMember = await models.OrganizerMembers.create({
                    name: randomUser.name,
                    email: randomUser.email,
                    phoneNumber: randomUser.phoneNumber,
                    title: title[ Math.floor( Math.random() * title.length )], // Random picks a title
                    password:  randomUser.password,
                    accepted: Math.random() < 0.5, // Randomly picks truth or false
                    dateJoined: new Date(),
                    profilePicture: randomUser.profilePicture,
                    organizer: { id: orgId.id }
                }).save()

                organizerTeamMembers[ orgId.id ].push( newMember.id );

                console.log(`\n\tCreated Random Team Member: ${randomUser.name}`);
            }

        }
    }

    return organizerTeamMembers;
}
