import { InputType, Field } from "type-graphql";

@InputType()
export class ReservationInput {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field()
    date: string;

    @Field()
    time: string;

    @Field()
    event_name: string;

    @Field()
    email: string;

    @Field()
    phone_number: string;
}