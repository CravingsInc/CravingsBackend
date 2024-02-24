import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Organizers } from "../Organizers";
import { EventTickets } from "./eventTickets";
import { EventsPageVisit } from "../analystics";


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
    @Column()
    description: string;

    @Field()
    @Column()
    banner: string;

    @Field()
    @Column({ default: false })
    visible: boolean;

    @Field()
    @Column({ default: "" })
    productId: string;

    @Field()
    @Column({ default: 0, nullable: true })
    latitude: number;

    @Field()
    @Column({ default: 0, nullable: true })
    longitude: number;

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

}
