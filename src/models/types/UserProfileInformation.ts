import { ObjectType, InputType, Field, ID } from "type-graphql";

@ObjectType()
export class UserProfileInformation {
    @Field( () => ID ) id: string;
    
    @Field() firstName: string;

    @Field() lastName: string;

    @Field() email: string;

    @Field() phoneNumber: string;

    @Field() username: string;

    @Field() profilePicture: string;

    @Field() followers: number;

    @Field() following: number;

    @Field() events: number;

    @Field() searchMilesRadius: number;
}

@InputType()
export class UserProfileInformationInput {
    @Field({ nullable: true }) firstName?: string;

    @Field({ nullable: true }) lastName?: string;

    @Field({ nullable: true }) email?: string;

    @Field({ nullable: true }) phoneNumber?: string;

    @Field({ nullable: true }) username?: string;
}
@ObjectType()
export class UsersFollowing {
    @Field()
    id: string;

    @Field()
    objectId: string;

    @Field()
    objectPic: string;

    @Field()
    objectName: string;

    @Field()
    type: 'user' | 'org';
}

@ObjectType()
export class UserDeleteOrgFollowing {
    @Field( () => UsersFollowing )
    deletedOrgFollowing: UsersFollowing;

    @Field( () => [ UsersFollowing ] )
    orgFollowing: UsersFollowing[];
}

@ObjectType()
export class UserDeleteUsersFollowing {
    @Field( () => UsersFollowing )
    deletedUserFollowing: UsersFollowing;

    @Field( () => [ UsersFollowing ] )
    userFollowing: UsersFollowing[];
}

