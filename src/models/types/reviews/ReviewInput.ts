import { InputType, Field, ID } from "type-graphql";

@InputType()
export class ReviewAnswerInput {
    @Field()
    questionId: string;

    @Field()
    questionType: "text" | "range" | "dropdown";

    @Field({ nullable: true })
    textAnswer?: string;

    @Field({ nullable: true })
    rangeAnswer?: number;

    @Field({ nullable: true })
    dropDownAnswerId?: string;
}

@InputType()
export class SubmitReviewInput {
    @Field()
    campaignId: string;

    @Field(() => [ReviewAnswerInput])
    answers: ReviewAnswerInput[];
}

@InputType()
export class UpdateReviewInput {
    @Field()
    reviewId: string;

    @Field(() => [ReviewAnswerInput])
    answers: ReviewAnswerInput[];
}
