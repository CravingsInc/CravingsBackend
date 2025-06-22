import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "./Events";
import { EventTickets } from "./eventTickets";

@Entity()
@ObjectType()
export class Coupon extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column({ unique: true })
    code: string;

    @Field()
    @Column()
    description: string;

    @Field()
    @Column({ type: 'float' })
    discountAmount: number;

    @Field()
    @Column({ default: 'percentage' })
    discountType: 'percentage' | 'fixed';

    @Field()
    @Column({ default: 1 })
    maxUses: number;

    @Field()
    @Column({ default: 0 })
    currentUses: number;

    @Field()
    @Column({ default: true })
    active: boolean;

    @Field()
    @Column({ nullable: true })
    validFrom: Date;

    @Field()
    @Column({ nullable: true })
    validUntil: Date;

    @Field()
    @Column({ default: false })
    appliesToAllTickets: boolean;

    @ManyToOne(() => Events, { onDelete: "CASCADE" })
    @Field(() => Events)
    event: Events;

    @ManyToOne(() => EventTickets, { nullable: true, onDelete: "CASCADE" })
    @Field(() => EventTickets, { nullable: true })
    specificTicket: EventTickets | null;

    @CreateDateColumn()
    @Field()
    createdAt: Date;

    @UpdateDateColumn()
    @Field()
    updatedAt: Date;
} 