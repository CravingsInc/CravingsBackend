import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, ManyToOne, UpdateDateColumn } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { EventRegistrationList } from ".";

export enum ActivityType {
    PERSON_CREATED = "PERSON_CREATED",
    PERSON_UPDATED = "PERSON_UPDATED",
    PERSON_REVOKED = "PERSON_REVOKED",

    INVITE_SENT = "INVITE_SENT",
    INVITE_OPENED = "INVITE_OPENED",
    INVITE_VISITED = "INVITE_VISITED",

    INVITE_ACCEPTED = "INVITE_ACCEPTED",
    INVITE_DECLINED = "INVITE_DECLINED"
}

@Entity()
@ObjectType()
export class EventRegistrationListActivity extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: string;

    @Field( () => ActivityType )
    @Column({
        type: 'enum',
        enum: ActivityType,
        default: ActivityType.PERSON_CREATED
    })
    activity: ActivityType;

    @Field()
    @Column()
    location: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field( () => EventRegistrationList )
    @ManyToOne( () => EventRegistrationList, e => e.activities, { onDelete: "CASCADE" })
    registrationList: EventRegistrationList;
}
