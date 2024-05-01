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
export class UserOrgFollowing {
    @Field()
    id: string;

    @Field()
    orgId: string;

    @Field()
    orgPic: string;

    @Field()
    orgName: string;
}

@ObjectType()
export class UserUsersFollowing {
    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    userPic: string;

    @Field()
    userName: string;
}

@ObjectType()
export class UserDeleteOrgFollowing {
    @Field( () => UserOrgFollowing )
    deletedOrgFollowing: UserOrgFollowing;

    @Field( () => [ UserOrgFollowing ] )
    orgFollowing: UserOrgFollowing[];
}

@ObjectType()
export class UserDeleteUsersFollowing {
    @Field( () => UserUsersFollowing )
    deletedUserFollowing: UserUsersFollowing;

    @Field( () => [ UserUsersFollowing ] )
    userFollowing: UserUsersFollowing[];
}

