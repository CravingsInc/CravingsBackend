import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn, BeforeInsert } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventDiscountsCodesRuleset } from "./ruleset";
import { DiscountType, EventDiscountsCodes } from ".";
import { EventTicketCart } from "../EventTicketCart";
import { EventTicketBuys } from "../EventTicketBuys";

@Entity()
@ObjectType()
export class EventAppliedDiscountCodes extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field( () => EventDiscountsCodes )
    @ManyToOne( () => EventDiscountsCodes, eDC => eDC.appliedCodes, { onDelete: 'CASCADE' } )
    discountCode: EventDiscountsCodes;

    @Field( () => EventTicketCart )
    @ManyToOne( () => EventTicketCart, eTC => eTC.appliedDiscountCodes, { onDelete: 'CASCADE' } )
    cart: EventTicketCart;

    @Field(() => EventTicketBuys, { nullable: true })
    @ManyToOne(() => EventTicketBuys, eTB => eTB.appliedDiscountCodes, { 
        onDelete: 'CASCADE',
        nullable: true 
    })
    ticketBuy: EventTicketBuys | null;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    appliedValue: number;

    @Field()
    @Column()
    appliedType: DiscountType;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    originalPrice: number;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    finalPrice: number;

    @Field()
    @CreateDateColumn()
    createdDate: Date;
}
