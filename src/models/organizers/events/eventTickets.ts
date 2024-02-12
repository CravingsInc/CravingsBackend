import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "./Events";
import { EventTicketBuys } from "./EventTicketBuys";

@Entity()
@ObjectType()
export class EventTickets extends BaseEntity {
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
    priceId: string;

    @Field( () => [EventTicketBuys] )
    @OneToMany( () => EventTicketBuys, eTB => eTB.eventTicket )
    buyers: EventTicketBuys[];

    @Field( () => Events )
    @ManyToOne( () => Events, e => e.prices, { onDelete: "CASCADE" })
    event: Events;

    @CreateDateColumn()
    @Field()
    createdAt: Date;

    @UpdateDateColumn()
    @Field()
    updatedAt: Date;

}
