import migrationData from '../migration.json';
import * as models from '../../models';
import bcrypt from "bcrypt";
import { CreateOrganizerResponse } from '../types';

export const createOrganizer = async (): Promise<CreateOrganizerResponse[]> => {
    let orgIds: CreateOrganizerResponse[] = [];

    console.log("\nCreating organizers...");

    for ( let testOrganizer of migrationData.organizers ) {
        let organizer = await models.Organizers.create({
            orgName: testOrganizer.orgName,
            email: testOrganizer.email,
            password: await bcrypt.hash( testOrganizer.password, 12 ),
            profilePicture: testOrganizer.profilePicture,
            phoneNumber: testOrganizer.phoneNumber,
            stripeConnectId: testOrganizer.stripeConnectId,
            banner: testOrganizer.banner,
            stripeAccountVerified: true,
            location: testOrganizer.location
        }).save();

        orgIds.push({ id: organizer.id, stripeAccount: testOrganizer.stripeConnectId });
        console.log(`\n\tCreated Organizer: ${organizer.id}`);
    }

    return orgIds;
}
