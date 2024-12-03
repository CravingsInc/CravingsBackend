import * as models from '../../models';
import { CreateOrganizerResponse, CreateUsersResponse, UserRandomFollowOrganizerResponse } from '../types';

export const userRandomFollowOrganizer = async ( userIds: CreateUsersResponse, orgIds: CreateOrganizerResponse[], totalFollowers: number = 3 ): Promise<UserRandomFollowOrganizerResponse> => {
    let followersIds: UserRandomFollowOrganizerResponse = {};

    console.log("\nUser following random organizers...");

    for ( let orgId of orgIds ) {
        
        followersIds[ orgId.id ] = [];

        for ( let i = 0; i < totalFollowers; i++ ) {
            let userId = userIds[ Math.floor( Math.random() * userIds.length ) ];

            let alreadyFollowing = await models.OrganizersFollowers.findOneBy({ user: { id: userId }, organizer: { id: orgId.id } });

            if ( !alreadyFollowing ) {
                let follower = await models.OrganizersFollowers.create({
                    user: { id: userId },
                    organizer: { id: orgId.id }
                }).save();

                followersIds[ orgId.id ].push( follower.id );

                console.log(`\n\tFollowing: ${userId} for organizer: ${orgId.id}`);
            }
        }
    }

    return followersIds;
}
