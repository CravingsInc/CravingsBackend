import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, OneToMany, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { EventTicketBuys } from "./EventTicketBuys";
import { Users } from "../../users";
import { EventTicketCartReview } from "./EventTicketCartReview";
import { Coupon } from "./Coupon";

@Entity()
export class EventTicketCart extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ default: 'guest' })
    type: "guest" | "user";

    @Column({ default: "UNKNOWN" })
    name: string;

    @Column({ default: "UNKNOWN" })
    email: string;

    @ManyToOne(() => Users, u => u.eventCarts, { onDelete: 'CASCADE', nullable: true })
    user?: Users | null;

    @Column()
    completed: boolean;

    @Column({ nullable: true })
    dateCompleted: Date;

    @Column({ nullable: true })
    checkIn: boolean;

    @Column({ nullable: true })
    dateCheckIn: Date;

    @Column({ default: '' })
    qrCode: string;

    @Column({ nullable: true })
    stripeTransactionId: string;

    @Column()
    eventId: string;

    @OneToMany(() => EventTicketBuys, eTB => eTB.cart)
    tickets: EventTicketBuys[];

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @Column({ nullable: true })
    lastReviewEmailSent?: Date;

    @Column({ default: false })
    reviewCompleted: boolean;

    @OneToOne(() => EventTicketCartReview)
    @JoinColumn()
    review: EventTicketCartReview;

    // Coupon-related fields
    @ManyToOne(() => Coupon, { nullable: true, onDelete: "SET NULL" })
    appliedCoupon?: Coupon | null;

    @Column({ nullable: true })
    appliedCouponId?: string;

    @Column({ type: 'float', default: 0 })
    discountAmount: number;

    @Column({ type: 'float', default: 0 })
    originalTotal: number;

    @Column({ type: 'float', default: 0 })
    finalTotal: number;
}
