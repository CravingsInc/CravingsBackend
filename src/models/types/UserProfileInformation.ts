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
