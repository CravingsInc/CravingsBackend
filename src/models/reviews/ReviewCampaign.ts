import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Events } from "../organizers/events/Events";
import { ReviewQuestion } from "./ReviewQuestion";
import { Review } from "./Review";

@Entity()
@ObjectType()
export class ReviewCampaign extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ type: "text" })
    description: string;

    @Field(() => Events)
    @ManyToOne(() => Events, { onDelete: "CASCADE" })
    @JoinColumn()
    eventId: Events;

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

    @Field(() => [Review])
    @OneToMany(() => Review, review => review.reviewCampaign, { cascade: true })
    reviews: Review[];
}
