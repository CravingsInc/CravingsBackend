import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from "typeorm";

@Entity()
export class EventTicketCartReview extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: number

    @Column({ default: '' })
    name: string;

    @Column({ default: 0 })
    rating: number;

    @Column({ nullable: true })
    photo?: string;

    @Column({ default: '' })
    description: string;

    @CreateDateColumn()
    dateCreated: Date;
}
