import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { ReviewAnswer } from "./ReviewAnswer";

@Entity()
@ObjectType()
export class Review extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("ReviewCampaign", (reviewCampaign: any) => reviewCampaign.reviews, { onDelete: "CASCADE" })
    @JoinColumn()
    reviewCampaign: any;

    @Field(() => [ReviewAnswer])
    @OneToMany(() => ReviewAnswer, answer => answer.review, { cascade: true })
    answers: ReviewAnswer[];

    @Field(() => Date, { nullable: true })
    @Column({ nullable: true })
    dateReviewCompleted: Date;

    @CreateDateColumn()
    @Field()
    dateCreated: Date;
}
