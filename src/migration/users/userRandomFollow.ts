import * as models from '../../models';
import { CreateUsersResponse, UserRandomFollowResponse } from '../types';

export const userRandomFollow = async ( userIds: CreateUsersResponse, totalFollowers: number = 3 ): Promise<UserRandomFollowResponse> => {
    let followersIds: UserRandomFollowResponse = {};

    console.log("\nRandomly following users...");

    for ( let userId of userIds ) {

        followersIds[ userId ] = [];

        console.log(`\n\tUser Being Followed: ${userId}`);

        for ( let j = 0; j < totalFollowers; j++ ) {
            let followerId = userIds[ Math.floor( Math.random() * userIds.length ) ];

            let alreadyFollowing = await models.UserFollowers.findOneBy({ user: { id: userId }, following: { id: followerId } });

            if ( !alreadyFollowing ) {
                await models.UserFollowers.create({
                    user: { id: userId },
                    following: { id: followerId }
                }).save();

                followersIds[ userId ].push( followerId );
                console.log(`\n\t\t${followerId} followed`);
            }

        }
    }

    return followersIds;
}
