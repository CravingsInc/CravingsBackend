import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "../Events";
import { EventRegistrationListActivity } from "./activity";

export enum RegistrationStatus {
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    CANCELLED = "CANCELLED",
    WAITING = "WAITING",
    NOT_SENT = "NOT_SENT"
}

@Entity()
@ObjectType()
export class EventRegistrationList extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn()
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    phoneNumber: string;

    @Field(() => RegistrationStatus)
    @Column({
        type: 'enum',
        enum: RegistrationStatus,
        default: RegistrationStatus.NOT_SENT
    })
    status: RegistrationStatus;

    @Field()
    @Column()
    registrationDate: Date;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field( () => [EventRegistrationListActivity] )
    @OneToMany( () => EventRegistrationListActivity, e => e.registrationList, { onDelete: "CASCADE" })
    activities: EventRegistrationListActivity;

    @Field( () => Events )
    @ManyToOne( () => Events, e => e.registrationsList, { onDelete: "CASCADE" })
    event: Events;
}