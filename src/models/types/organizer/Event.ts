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

    @Field() eventDate: Date;

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

    @Field({ nullable: true }) eventDate?: Date;

    @Field({ nullable: true }) endDate?: Date;
}

@InputType()
export class ModifyEventTicketInputType {
    @Field() id: string;

    @Field({ nullable: true }) title?: string;

    @Field({ nullable: true }) description?: string;

    @Field({ nullable: true }) totalTicketAvailable?: number;
}

@InputType()
export class ModifyEventTicketPriceInputType {
    @Field() id: string;

    @Field() amount: number;

    @Field({ nullable: true, defaultValue: "usd" }) currency?: string;
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
    eventDate: string;
    eLat: number;
    eLong: number;
    location: string;
    uLat: number;
    uLong: number;
    orgId: string;
    orgStripeConnectId: string;
    orgName: string;
    orgProfilePicture: string;
    ticketSold: number;
    milesNum: number;
}

@ObjectType()
export class EventsPageOrganizer {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() profilePicture: string;

    @Field() events: number;

    @Field() followers: number;

}

@ObjectType()
export class EventsPagePrices {
    @Field( () => ID ) id: string;

    @Field() title: string;

    @Field() description: string;

    @Field() amount: number;

    @Field() ticketAvailable: number;
}

@ObjectType()
export class PhotoGallery {
    @Field( () => ID ) id: string;
    
    @Field() picture: string;

    @Field() eventId: string;
}

@ObjectType()
export class EventsPage {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() description: string;

    @Field() banner: string;

    @Field() costRange: string;

    @Field() ticketSold: string;

    @Field() userFollowing: boolean;

    @Field() eventDate: Date;

    @Field() endEventDate: Date;

    @Field() ticketType: string;

    @Field() ticketAvailable: number;

    @Field( () => [ PhotoGallery ] ) photoGallery: PhotoGallery[];

    @Field( () => Location ) location: Location;

    @Field( () => EventsPageOrganizer ) organizer: EventsPageOrganizer;

    @Field( () => [EventsPagePrices] ) prices: EventsPagePrices[];
}

@InputType()
export class TicketBuyClientSecretUpdate {
    // Price ID
    @Field() id: string;

    @Field() quantity: number;
}
@ObjectType()
export class EventTicketBuyer {
    @Field() name: string;

    @Field() email: string;

    @Field() admitCount: number;
}

@ObjectType()
export class EventTicket {
    @Field( () => ID ) id: string;
    
    @Field() name: string;
    
    @Field() banner: string;
    
    @Field() date: Date;
    
    @Field( () => EventTicketBuyer ) buyer: EventTicketBuyer;;

    @Field() paymentIntent: string;
}

@ObjectType()
export class EventTicketReview {
    @Field() eventId: string;
    
    @Field() eventBanner: string;

    @Field() eventTitle: string;

    @Field() rating: number;

    @Field() ratingId: string;

    @Field() ratingName: string;

    @Field({ nullable: true }) photo: string;

    @Field() description: string;

    @Field() reviewCompleted: boolean;

    @Field() payment_intent: string;

    @Field({ nullable: true }) dateReviewCompleted: Date;
}

@InputType()
export class EventTicketReviewInput {
    @Field() rating: number;
    @Field() name: string;
    @Field() photo: string;
    @Field() description: string;
}
