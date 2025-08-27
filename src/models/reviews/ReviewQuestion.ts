import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { DropDown } from "./DropDown";
import { ReviewCampaign } from "./ReviewCampaign";

@Entity()
@ObjectType()
export class ReviewQuestion extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field()
    @Column()
    question: string;

    @Field()
    @Column({
        type: "varchar",
        default: "text"
    })
    questionType: "text" | "range" | "dropdown";

    @Field(() => Number, { nullable: true })
    @Column({ nullable: true, type: "int" })
    rangeMin: number | null;

    @Field(() => Number, { nullable: true })
    @Column({ nullable: true, type: "int" })
    rangeMax: number | null;

    @Field(() => [DropDown], { nullable: true })
    @OneToMany(() => DropDown, dropDown => dropDown.reviewQuestion, { cascade: true })
    dropDown: DropDown[];

    @Field(() => ReviewCampaign)
    @ManyToOne(() => ReviewCampaign, reviewCampaign => reviewCampaign.questions, { onDelete: "CASCADE" })
    @JoinColumn()
    reviewCampaign: ReviewCampaign;

    @CreateDateColumn()
    @Field()
    createdAt: Date;

    @UpdateDateColumn()
    @Field()
    modifiedAt: Date;
}
