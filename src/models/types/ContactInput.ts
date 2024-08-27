import { InputType, Field } from "type-graphql";

@InputType()
export class ContactInput {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field()
    message: string;

    @Field()
    email: string;

    @Field()
    phone_number: string;

    @Field({ nullable: true })
    organizer?: boolean;
}
