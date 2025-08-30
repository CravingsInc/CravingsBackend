import { InputType, Field, ID, ObjectType } from "type-graphql";
import { ReviewCampaign } from "../../reviews/ReviewCampaign";

@ObjectType()
export class CreateReviewCampaignPayload {
    @Field(() => ReviewCampaign, { nullable: true })
    reviewCampaign: ReviewCampaign;
}

@InputType()
export class DropDownInput {
    @Field()
    text: string;

    @Field()
    value: string;
}

@InputType()
export class ReviewQuestionInput {
    @Field()
    question: string;

    @Field()
    questionType: "text" | "range" | "dropdown";

    @Field({ nullable: true })
    rangeMin?: number;

    @Field({ nullable: true })
    rangeMax?: number;

    @Field(() => [DropDownInput], { nullable: true })
    dropDown?: DropDownInput[];
}

@InputType()
export class CreateReviewCampaignInput {
    @Field()
    title: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    startDate?: string;

    @Field({ nullable: true })
    endDate?: string;

    @Field()
    eventId: string;

    @Field(() => [ReviewQuestionInput])
    questions: ReviewQuestionInput[];

    @Field({ defaultValue: "all" })
    for: "all" | "ticket_type";

    @Field({ nullable: true })
    for_id?: string;
}

@InputType()
export class UpdateReviewCampaignInput {
    @Field()
    id: string;

    @Field({ nullable: true })
    title?: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    startDate?: string;

    @Field({ nullable: true })
    endDate?: string;

    @Field({ nullable: true })
    for?: "all" | "ticket_type";

    @Field({ nullable: true })
    for_id?: string;
}

@InputType()
export class AddQuestionToCampaignInput {
    @Field()
    campaignId: string;

    @Field(() => ReviewQuestionInput)
    question: ReviewQuestionInput;
}

@InputType()
export class UpdateQuestionInput {
    @Field()
    id: string;

    @Field({ nullable: true })
    question?: string;

    @Field({ nullable: true })
    questionType?: "text" | "range" | "dropdown";

    @Field({ nullable: true })
    rangeMin?: number;

    @Field({ nullable: true })
    rangeMax?: number;

    @Field(() => [DropDownInput], { nullable: true })
    dropDown?: DropDownInput[];
}
