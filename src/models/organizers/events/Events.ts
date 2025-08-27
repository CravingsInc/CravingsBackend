import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn, BeforeInsert } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "../Organizers";
import { EventTickets } from "./eventTickets";
import { EventsPageVisit } from "../../analysis";
import { Utils } from "../../../utils";
import { EventPhotos } from "./EventPhotos";

@Entity()
@ObjectType()
export class Events extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column({ type: Utils?.AppConfig.TEST_SERVER ? "longtext" : undefined })
    description: string;

    @Field()
    @Column({ default: "/home-header.png" })
    banner: string;

    @Field()
    @Column({ default: false })
    visible: boolean; // If this event is available for people to start viewing and buying tickets for

    @Field()
    @Column({ default: "PAID_TICKET" })
    type: "PAID_TICKET" | "CYOP" | "REGISTRATION"; // Type of event it is

    @Field()
    @Column({ default: true })
    is_monetized: boolean; // If this event is monetized or not, this is useful for if event is registration only but your taking payment

    @Field()
    @Column({ default: true })
    is_public: boolean; // If this event is public or private, private events are only accessible via direct link, meaning this event wont show up on app, and it won't be searchable

    @Field()
    @Column({ default: "" })
    productId: string;

    @Field()
    @Column({ default: 0, nullable: true, type: 'float' })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true, type: 'float' })
    longitude: number;

    @Field()
    @Column({ default: '' })
    location: string;

    @Field()
    @Column({ default: 'limited' })
    ticketType: 'infinite' | 'limited';

    @Field()
    @Column({ default: "America/New_York" })
    timezone: string;

    @Field()
    @Column({ default: () => "CURRENT_TIMESTAMP" })
    eventDate: Date;

    @Field()
    @Column({ default: () => "CURRENT_TIMESTAMP" })
    endEventDate: Date;

    @Field( () => [EventTickets] )
    @OneToMany( () => EventTickets, eT => eT.event )
    prices: EventTickets[];

    @Field( () => [ EventsPageVisit ])
    @OneToMany( () => EventsPageVisit, ePV => ePV.event )
    pageVisitors: EventsPageVisit[]; 
    
    @Field( () => Organizers )
    @ManyToOne( () => Organizers, o => o.events, { onDelete: "CASCADE" })
    organizer: Organizers;

    /**
     * @description main event, or starting event that creates all other "repeats events"
     */
    @ManyToOne( () => Events, e => e.repeats, { onDelete: 'CASCADE' } )
    parent: Events;

    /**
     * @description events that are repeated by this event. A repeat event CAN NOT have another repeat event
     */
    @OneToMany( () => Events, e => e.parent )
    repeats: Events[];

    @Field( () => EventPhotos )
    @OneToMany( () => EventPhotos, e => e.event )
    photoGallery: EventPhotos[];
    
    @CreateDateColumn()
    @Field()
    createdAt: Date;

    @UpdateDateColumn()
    @Field()
    updatedAt: Date;

    @BeforeInsert()
    private setEventDate() {
        if ( !this.eventDate ) this.eventDate = new Date();
    }
}
