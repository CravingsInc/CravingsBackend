import { ObjectType, InputType, Field } from "type-graphql";

@ObjectType()
export class UserProfileInformation {
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
