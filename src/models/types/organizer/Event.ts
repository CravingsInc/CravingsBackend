import { ObjectType, InputType, Field, ID } from "type-graphql";
import { Location } from "../Location";
import { EventType } from "../../organizers";

@InputType()
export class CreateEventInput {
    @Field() title: string;

    @Field() description: string;

    @Field( () => EventType ) type: EventType;

    @Field() is_public: boolean;

    @Field() is_monetized: boolean;
}

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

    @Field({ nullable: true }) startDate?: Date;

    @Field({ nullable: true }) endDate?: Date;

    @Field({ nullable: true }) timezone?: string;
}

@InputType()
export class ModifyEventTicketInputType {
    @Field() id: string;

    @Field({ nullable: true }) title?: string;

    @Field({ nullable: true }) description?: string;

    @Field({ nullable: true }) amount?: number;
    
    @Field({ nullable: true, defaultValue: "usd" }) currency?: string;

    @Field({ nullable: true }) totalTicketAvailable?: number;
}

@ObjectType()
export class GetSalesPageResponseTicketsShortened {
    @Field( () => ID ) id: string;

    @Field() title: string;

    @Field() description: string;

    @Field() quantity: number;

    @Field() price: number;
}

@ObjectType()
export class GetSalesPageResponseTickets {
    @Field( () => ID ) id: string;

    @Field() title: string;

    @Field() description: string;
    
    @Field() totalTickets: number;

    @Field() ticketSold: number;

    @Field() ticketPrice: number;
}

@ObjectType() 
export class SalesCheckIn {
    @Field() checkIn: boolean;

    @Field() date: Date;
}

@ObjectType() 
export class SalesCompleted {
    @Field() completed: boolean;

    @Field() date: Date;
}

@ObjectType()
export class SalesReview {
    @Field() id: string;
    
    @Field() name: string;

    @Field() profile: string;

    @Field() rating: number;

    @Field() description: string;

    @Field() completed: boolean;

    @Field() date: Date;
}

@ObjectType()
export class GetSalesPageResponseSales {
    @Field( () => ID ) id: string;

    @Field() name: string;

    @Field() amount: number;

    @Field() dateCreated: Date;

    @Field() currency: string;

    @Field( () => SalesCheckIn ) checkIn: SalesCheckIn;

    @Field( () => SalesCompleted ) completed: SalesCompleted;

    @Field( () => [GetSalesPageResponseTicketsShortened] ) tickets: GetSalesPageResponseTicketsShortened[];

    @Field( () => SalesReview, { nullable: true }) review?: SalesReview;
}

@ObjectType()
export class GetSalesPageResponse {
    @Field( () => [ GetSalesPageResponseTickets ]) tickets: GetSalesPageResponseTickets[];

    @Field( () => [ GetSalesPageResponseSales ]) sales: GetSalesPageResponseSales[];
}

@InputType()
export class GetSalesPageFilterInputOptions {
    @Field({ nullable: true }) checkedIn?: boolean;
    @Field({ nullable: true }) leftReview?: boolean;
}

@InputType()
export class GetSalesPageInput {
    @Field({ defaultValue: '' }) search?: string;
    @Field( () => GetSalesPageFilterInputOptions, { nullable: true }) filter?: GetSalesPageFilterInputOptions
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

@InputType()
export class RegisterFreeEventInput {
    @Field() eventId: string;

    @Field() name: string;

    @Field() email: string;

    @Field() phoneNumber: string;

    @Field({ nullable: true }) userToken?: string;

    @Field() cartId: string;

    @Field( () => [TicketBuyClientSecretUpdate] ) tickets: TicketBuyClientSecretUpdate[];
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

    @Field() cart_id: string;
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

    @Field() cart_id: string;

    @Field({ nullable: true }) dateReviewCompleted: Date;
}

@ObjectType()
export class EventReviewCard {
    @Field() photo: string;

    @Field() name: string;

    @Field() rating: number;

    @Field() description: string;

    @Field({ nullable: true }) dateCompleted: Date;
}

@ObjectType()
export class EventDate {
    @Field() startDate: Date;
    
    @Field() endDate: Date;
}

@ObjectType()
export class LoadAllEventsPageEventResponse {
    @Field( () => ID ) id: string;

    @Field() title: string;

    @Field() banner: string;
    
    @Field() visibility: "Public" | "Private"

    @Field() views: number;

    @Field() dateCreated: Date;

    @Field( () => EventDate ) eventDate: EventDate;
}

@ObjectType()
export class LoadEventDetailsPageResponse extends LoadAllEventsPageEventResponse {
    @Field() description: string;

    @Field() location: string;

    @Field() totalTicketSold: number;

    @Field() timezone: string;
}

@ObjectType()
export class GalleryPageResponse {
    @Field( () => ID ) id: string;

    @Field() url: string;

    @Field() dateUploaded: Date;
}

@ObjectType()
export class LoadAllEventsGalleryPageResponse {
    @Field() endIndex: number;
    
    @Field() loadMore: boolean;

    @Field( () => [ GalleryPageResponse ]) gallery: GalleryPageResponse[];
}

@ObjectType()
export class LoadAllEventsPageResponse {
    @Field() endIndex: number;
    @Field() loadMore: boolean;
    @Field( () => [LoadAllEventsPageEventResponse] ) events: LoadAllEventsPageEventResponse[];
}

@ObjectType()
export class LoadDashboardPageTaskResponse {
    @Field() id: string;

    @Field() title: string;

    @Field() userName: string;

    @Field() userProfile: string;

    @Field() dueDate: Date;

    @Field() status: "todo" | "completed"
}

@ObjectType()
export class LoadDashboardPageOrdersResponse {
    @Field() id: string;

    @Field() name: string;

    @Field() eventId: string;

    @Field() dateCompleted: Date;

    @Field({ nullable: true }) amount: number;
}

@ObjectType()
export class LoadDashboardPageResponse {
    @Field() totalBalance: number;

    @Field() totalEvents: number;

    @Field() totalTicketsSold: number;

    @Field() memberDashboardEnabled: boolean;

    @Field( () => [LoadDashboardPageTaskResponse] ) tasks: LoadDashboardPageTaskResponse[];

    @Field( () => [ LoadDashboardPageOrdersResponse ] ) orders: LoadDashboardPageOrdersResponse[];
}

@InputType()
export class LoadAllEventsPageFilterOptions {
    @Field({ nullable: true }) upcoming?: boolean;
    @Field({ nullable: true }) completed?: boolean;
    @Field({ nullable: true }) ongoing?: boolean;
    @Field({ nullable: true }) private?: boolean;
    @Field({ nullable: true }) public?: boolean;
}

@InputType()
export class LoadAllEventPageInput {
    @Field({ defaultValue: 7 }) pageLength: number;
    @Field({ defaultValue: 0 }) lastIndex: number;
    @Field({ defaultValue: '' }) search?: string;
    @Field( () => LoadAllEventsPageFilterOptions, { nullable: true }) filter?: LoadAllEventsPageFilterOptions;
}

@ObjectType()
export class CreateTicketSellClientSecretResponse {
    @Field() client_secret: string;
    @Field() cartId: string;
}

@ObjectType()
export class UpdatePaymentIntentResponse {
    @Field({ nullable: true })
    client_secret?: string;

    @Field()
    cartId: string;

    @Field()
    subtotal: number;

    @Field()
    totalDiscount: number;

    @Field()
    total: number;

    @Field(() => [String], { nullable: true })
    appliedDiscounts?: string[];
}

@ObjectType()
export class CartDetails {
    @Field()
    id: string;

    @Field()
    subtotal: number;

    @Field()
    totalDiscount: number;

    @Field()
    total: number;

    @Field(() => [String])
    appliedDiscounts: string[];

    @Field(() => [CartItem])
    items: CartItem[];
}

@ObjectType()
export class CartItem {
    @Field()
    ticketId: string;

    @Field()
    name: string;

    @Field()
    quantity: number;

    @Field()
    unitPrice: number;

    @Field()
    totalPrice: number;

    @Field()
    discountAmount: number;
}

@InputType()
export class EventTicketReviewInput {
    @Field() rating: number;
    @Field() name: string;
    @Field() photo: string;
    @Field() description: string;
}
