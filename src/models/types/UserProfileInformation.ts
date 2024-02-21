import { ObjectType, InputType, Field, ID } from "type-graphql";

@ObjectType()
export class UserProfileInformation {
    @Field( () => ID ) id: string;
    
    @Field() firstName: string;

    @Field() lastName: string;

    @Field() email: string;

    @Field() phoneNumber: string;

    @Field() username: string;
}

@InputType()
export class UserProfileInformationInput {
    @Field() firstName: string;

    @Field() lastName: string;

    @Field() email: string;

    @Field() phoneNumber: string;

    @Field() username: string;
}
