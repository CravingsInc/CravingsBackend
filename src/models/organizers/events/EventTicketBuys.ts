import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventTickets } from "./eventTickets";
import { Users } from "../../users";

@Entity()
@ObjectType()
export class EventTicketBuys extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    type: "guest" | "user";

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    quantity: number;

    @Field()
    @Column()
    checkIn: boolean;

    @Column({ nullable: false })
    stripeTransactionId: string;

    @Field( () => Users, { nullable: true })
    @ManyToOne( () => Users, u => u.eventTickets, { onDelete: 'CASCADE', nullable: true })
    user?: Users | null;

    @Field( () => EventTickets )
    @ManyToOne( () => EventTickets, eT => eT.buyers, { onDelete: 'CASCADE' })
    eventTicket: EventTickets;

    @Field()
    @CreateDateColumn()
    createdDate: Date;
}