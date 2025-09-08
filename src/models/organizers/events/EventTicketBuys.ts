import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, OneToMany } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventTickets } from "./eventTickets";
import { Users } from "../../users";
import { EventTicketCart } from "./EventTicketCart";
import { EventAppliedDiscountCodes } from "./discount";

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

    @ManyToOne( () => EventTicketCart, eTC => eTC.tickets )
    cart: EventTicketCart;

    @Field( () => Users, { nullable: true })
    @ManyToOne( () => Users, u => u.eventTickets, { onDelete: 'CASCADE', nullable: true })
    user?: Users | null;

    @Field( () => EventTickets )
    @ManyToOne( () => EventTickets, eT => eT.buyers, { onDelete: 'CASCADE' })
    eventTicket: EventTickets;

    @Field(() => [EventAppliedDiscountCodes])
    @OneToMany(() => EventAppliedDiscountCodes, eADC => eADC.ticketBuy)
    appliedDiscountCodes: EventAppliedDiscountCodes[];

    // Ticket-level pricing
    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discountAmount: number;

    @Field()
    @CreateDateColumn()
    createdDate: Date;
}
