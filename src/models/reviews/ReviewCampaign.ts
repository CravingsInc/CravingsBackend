import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "../organizers/events/Events";
import { ReviewQuestion } from "./ReviewQuestion";

@Entity()
@ObjectType()
export class ReviewCampaign extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    title: string;

    @Field(() => String, { nullable: true })
    @Column({ type: "text", nullable: true })
    description: string | null;

    @Field(() => Events)
    @ManyToOne(() => Events, { onDelete: "CASCADE" })
    @JoinColumn()
    eventId: Events;

    @Field(() => Date, { nullable: true })
    @Column({ nullable: true, type: "datetime" })
    startDate: Date | null;

    @Field(() => Date, { nullable: true })
    @Column({ nullable: true, type: "datetime" })
    endDate: Date | null;

    @Field(() => [ReviewQuestion])
    @OneToMany(() => ReviewQuestion, question => question.reviewCampaign, { cascade: true })
    questions: ReviewQuestion[];

    @Field()
    @Column({
        type: "varchar",
        default: "all"
    })
    for: "all" | "ticket_type";

    @Field(() => String, { nullable: true })
    @Column({ nullable: true, type: "varchar" })
    for_id: string | null;

    @CreateDateColumn()
    @Field()
    dateCreated: Date;

    @UpdateDateColumn()
    @Field()
    dateModified: Date;


}
