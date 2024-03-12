import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, OneToMany, UpdateDateColumn } from "typeorm";
import { EventTicketBuys } from "./EventTicketBuys";

@Entity()
export class EventTicketCart extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    completed: boolean;

    @Column({ default: '' })
    qrCode: string;

    @Column({ nullable: true })
    stripeTransactionId: string;

    @Column()
    eventId: string;

    @OneToMany( () => EventTicketBuys, eTB => eTB.cart )
    tickets: EventTicketBuys[];

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;
}
