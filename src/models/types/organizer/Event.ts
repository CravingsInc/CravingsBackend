import { ObjectType, InputType, Field, ID } from "type-graphql";
import { Location } from "../Location";

@ObjectType()
export class EventOrganizerResponse {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() profilePicture: string;
}

@ObjectType()
export class EventRecommendationResponse {
    @Field( () => ID ) id: string;

    @Field() title: string;

    @Field() description: string;

    @Field() banner: string;

    @Field() costRange: string;

    @Field( () => Location ) location: Location; 

    @Field( () => EventOrganizerResponse ) organizer: EventOrganizerResponse;
}

@InputType()
export class ModifyEventInputType {
    @Field() id: string;

    @Field({ nullable: true }) title?: string;

    @Field({ nullable: true }) description?: string;

    @Field({ nullable: true }) visible?: boolean;

    @Field({ nullable: true }) location?: string;

    @Field({ nullable: true }) banner?: string;
}

@InputType()
export class ModifyEventTicketInputType {
    @Field() id: string;

    @Field({ nullable: true }) title?: string;

    @Field({ nullable: true }) description?: string;
}

@InputType()
export class ModifyEventTicketPriceInputType {
    @Field() id: string;

    @Field() amount: number;

    @Field({ nullable: true, defaultValue: "us" }) currency?: string;
}

export type EventRecommendationDatabaseResponse = {
    id: string;
    title: string;
    description: string;
    banner: string;
    productId: string;
    createdAt: string;
    updatedAt: string;
    organizerId: string;
    eLat: number;
    eLong: number;
    uLat: number;
    uLong: number;
    orgId: string;
    orgName: string;
    orgProfilePicture: string;
    ticketSold: number;
    milesNum: number;
}
