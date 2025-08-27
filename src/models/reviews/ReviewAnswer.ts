import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Review } from "./Review";
import { ReviewQuestion } from "./ReviewQuestion";
import { DropDown } from "./DropDown";

@Entity()
@ObjectType()
export class ReviewAnswer extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Field(() => Review)
    @ManyToOne(() => Review, (review: Review) => review.answers, { onDelete: "CASCADE" })
    @JoinColumn()
    review: Review;

    @Field(() => ReviewQuestion)
    @ManyToOne(() => ReviewQuestion, { onDelete: "CASCADE" })
    @JoinColumn()
    questionId: ReviewQuestion;

    @Field()
    @Column({
        type: "varchar",
        default: "text"
    })
    questionType: "text" | "range" | "dropdown";

    @Field({ nullable: true })
    @Column({ nullable: true })
    textAnswer: string;

    @Field({ nullable: true })
    @Column({ nullable: true, type: "int" })
    rangeAnswer: number;

    @Field(() => DropDown, { nullable: true })
    @ManyToOne(() => DropDown, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn()
    dropDownAnswer: DropDown | null;

    @CreateDateColumn()
    @Field()
    createAt: Date;

    @UpdateDateColumn()
    @Field()
    modifiedAt: Date;
}
