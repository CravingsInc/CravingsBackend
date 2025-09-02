import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, UpdateDateColumn, OneToMany } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventDiscountsCodes } from ".";
import { DiscountApplicableTickets } from "./applicableTickets";

export enum DiscountRuleset {
    // Discount only available until a certain time is reached
    TIMED_DISCOUNT = "TIMED_DISCOUNT",

    // Discount applied to specific ticket types
    TICKET_DISCOUNT = "TICKET_DISCOUNT"
}

@Entity()
@ObjectType()
export class EventDiscountsCodesRuleset extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => DiscountRuleset)
    @Column({ type: 'enum', enum: DiscountRuleset, default: DiscountRuleset.TIMED_DISCOUNT })
    ruleset: DiscountRuleset;

    @Field()
    @Column({ type: 'timestamp', nullable: true })
    timedValue: Date | null;

    @Field(() => [DiscountApplicableTickets])
    @OneToMany(() => DiscountApplicableTickets, dat => dat.ruleset)
    applicableTickets: DiscountApplicableTickets[];

    // Helper method to get ticket IDs
    getTicketIds(): string[] {
        return this.applicableTickets
            ?.map(dat => dat?.ticket?.id)
            .filter((id): id is string => !!id) || [];
    }

    @Field(() => EventDiscountsCodes)
    @ManyToOne(() => EventDiscountsCodes, e => e.rules, { onDelete: "CASCADE" })
    discount: EventDiscountsCodes;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}