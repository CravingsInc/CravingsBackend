import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { ReviewCampaign } from "./ReviewCampaign";
import { ReviewAnswer } from "./ReviewAnswer";

@Entity()
@ObjectType()
export class Review extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field(() => ReviewCampaign)
    @ManyToOne(() => ReviewCampaign, reviewCampaign => reviewCampaign.reviews, { onDelete: "CASCADE" })
    @JoinColumn()
    reviewCampaign: ReviewCampaign;

    @Field(() => [ReviewAnswer])
    @OneToMany(() => ReviewAnswer, answer => answer.review, { cascade: true })
    answers: ReviewAnswer[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    dateReviewCompleted: Date;

    @CreateDateColumn()
    @Field()
    dateCreated: Date;
}
