import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class Location {
    @Field() latitude: number;

    @Field() longitude: number;
}
