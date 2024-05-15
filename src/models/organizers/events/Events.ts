import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn, BeforeInsert } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "../Organizers";
import { EventTickets } from "./eventTickets";
import { EventsPageVisit } from "../analystics";
import { Utils } from "../../../utils";


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
    @Column({ type: Utils.AppConfig.TEST_SERVER ? "longtext" : undefined })
    description: string;

    @Field()
    @Column({ default: "/home-header.png" })
    banner: string;

    @Field()
    @Column({ default: false })
    visible: boolean;

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
    @Column({ default: 'infinite' })
    ticketType: 'infinite' | 'limited';

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
