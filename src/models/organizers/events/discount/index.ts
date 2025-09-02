import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn, BeforeInsert } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventDiscountsCodesRuleset } from "./ruleset";
import { Events } from "../Events";

export * from './ruleset';
export * from './applicableTickets';

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
}
