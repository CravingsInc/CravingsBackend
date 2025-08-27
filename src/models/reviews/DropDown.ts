import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { ReviewQuestion } from "./ReviewQuestion";

@Entity()
@ObjectType()
export class DropDown extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    text: string;

    @Field()
    @Column()
    value: string;

    @CreateDateColumn()
    @Field()
    dateCreated: Date;

    @UpdateDateColumn()
    @Field()
    dateModified: Date;

    @Field(() => ReviewQuestion)
    @ManyToOne(() => ReviewQuestion, reviewQuestion => reviewQuestion.dropDown, { onDelete: "CASCADE" })
    @JoinColumn()
    reviewQuestion: ReviewQuestion;
}
