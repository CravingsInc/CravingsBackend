import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn, BeforeInsert } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { DiscountRuleset, EventDiscountsCodesRuleset } from "./ruleset";
import { Events } from "../Events";
import { EventAppliedDiscountCodes } from "./applied";

export * from './ruleset';
export * from './applicableTickets';
export * from './applied';

export enum DiscountType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}

@Entity()
@ObjectType()
export class EventDiscountsCodes extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Field( () => DiscountType )
    @Column()
    discountType: DiscountType;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    value: number;

    @Field()
    @Column({ default: false })
    isActive: boolean;

    @Field()
    @Column({ default: 0 })
    usageCount: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    maxUsage: number | null;

    @Field(() => [EventDiscountsCodesRuleset])
    @OneToMany(() => EventDiscountsCodesRuleset, e => e.discount)
    rules: EventDiscountsCodesRuleset[];

    @Field(() => [EventAppliedDiscountCodes])
    @OneToMany(() => EventAppliedDiscountCodes, eADC => eADC.discountCode)
    appliedCodes: EventAppliedDiscountCodes[];

    @Field(() => Events)
    @ManyToOne(() => Events, e => e.discounts, { onDelete: "CASCADE" })
    event: Events;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    isValid(): boolean {
        return this.isActive && (this.maxUsage === null || this.usageCount < this.maxUsage);
    }

    applyDiscount(originalPrice: number): number {
        if (this.discountType === "percentage") {
            return originalPrice * (1 - this.value / 100);
        } else {
            return Math.max(0, originalPrice - this.value);
        }
    }

    calculateDiscountForTicket(ticketPrice: number, ticketId: string): number {
        if (!this.isValid()) return 0;

        for (const rule of this.rules) {
            if (rule.ruleset === DiscountRuleset.TIMED_DISCOUNT) {
                // Apply to all tickets
                return this.applyDiscount(ticketPrice);
            } else if (rule.ruleset === DiscountRuleset.TICKET_DISCOUNT) {
                // Check if this ticket is applicable
                const isApplicable = rule.applicableTickets.some(
                    applicable => applicable.ticket.id === ticketId
                );
                if (isApplicable) {
                    return this.applyDiscount(ticketPrice);
                }
            }
        }
        return 0;
    }

    // Helper to check if discount applies to cart
    isApplicableToCart(cartItems: Array<{ ticketId: string; price: number }>): boolean {
        if (!this.isValid()) return false;

        for (const rule of this.rules) {
            if (rule.ruleset === DiscountRuleset.TIMED_DISCOUNT) {
                return true; // Applies to entire cart
            } else if (rule.ruleset === DiscountRuleset.TICKET_DISCOUNT) {
                // Check if any cart item matches applicable tickets
                return cartItems.some(item =>
                    rule.applicableTickets.some(
                        applicable => applicable.ticket.id === item.ticketId
                    )
                );
            }
        }
        return false;
    }
}
