import migrationData from '../migration.json';
import * as models from '../../models';
import bcrypt from "bcrypt";
import { CreateUsersResponse } from '../types';

export const createUsers = async (): Promise<CreateUsersResponse> => {
    let usersIds: CreateUsersResponse = [];

    console.log("\nCreating users...");

    for ( let testUser of migrationData.users ) {
        let user = await models.Users.create({
            username: testUser.username,
            email: testUser.email,
            password: await bcrypt.hash( testUser.password, 12 ),
            profilePicture: testUser.profilePicture,
            phoneNumber: testUser.phoneNumber,
            stripeCustomerId: testUser.stripeCustomerId,
            searchMilesRadius: 50,
            notificationUpdate: true,
            notificationNewFollower: true
        }).save();

        usersIds.push( user.id );
        console.log(`\n\tCreated User: ${user.id}`);
    }

    return usersIds;
}
