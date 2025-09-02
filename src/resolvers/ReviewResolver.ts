import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware } from "type-graphql";
import { ReviewCampaign, ReviewQuestion, Review, ReviewAnswer, DropDown } from "../models/reviews";
import { CreateReviewCampaignInput, UpdateReviewCampaignInput, AddQuestionToCampaignInput, UpdateQuestionInput, SubmitReviewInput, UpdateReviewInput, CreateReviewCampaignPayload } from "../models/types/reviews";
import { Events } from "../models/organizers/events/Events";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class ReviewResolver {
    // Review Campaign Queries
    @Query(() => [ReviewCampaign])
    async getReviewCampaigns(@Arg("eventId") eventId: string) {
        return await ReviewCampaign.find({
            where: { eventId: { id: eventId } },
            relations: ["questions", "questions.dropDown", "reviews"]
        });
    }

    @Query(() => ReviewCampaign, { nullable: true })
    async getReviewCampaign(@Arg("id") id: string) {
        return await ReviewCampaign.findOne({
            where: { id },
            relations: ["questions", "questions.dropDown", "reviews", "reviews.answers"]
        });
    }

    @Query(() => [ReviewCampaign])
    async getReviewCampaignsForUser(@Arg("eventId") eventId: string, @Arg("ticketType") ticketType?: string) {
        const campaigns = await ReviewCampaign.find({
            where: { eventId: { id: eventId } },
            relations: ["questions", "questions.dropDown"]
        });

        if (!ticketType) {
            return campaigns.filter(campaign => campaign.for === "all");
        }

        return campaigns.filter(campaign =>
            campaign.for === "all" ||
            (campaign.for === "ticket_type" && campaign.for_id && campaign.for_id.includes(ticketType))
        );
    }

    // Review Campaign Mutations
    @Mutation(() => CreateReviewCampaignPayload)
    @UseMiddleware(isAuth)
    async createReviewCampaign(@Arg("input") input: CreateReviewCampaignInput, @Ctx() { req }: any) {
        const event = await Events.findOne({ where: { id: input.eventId } });
        if (!event) {
            throw new Error("Event not found");
        }

        const campaign = new ReviewCampaign();
        campaign.title = input.title;
        campaign.description = input.description || null;
        campaign.startDate = input.startDate ? new Date(input.startDate) : new Date();
        campaign.endDate = input.endDate ? new Date(input.endDate) : new Date();
        campaign.eventId = event;
        campaign.for = input.for;
        campaign.for_id = input.for_id || null;

        await campaign.save();

        // Create questions
        for (const questionInput of input.questions) {
            const question = new ReviewQuestion();
            question.question = questionInput.question;
            question.questionType = questionInput.questionType;
            question.rangeMin = questionInput.rangeMin || null;
            question.rangeMax = questionInput.rangeMax || null;
            question.reviewCampaign = campaign;

            await question.save();

            // Create dropdown options if needed
            if (questionInput.dropDown && questionInput.questionType === "dropdown") {
                for (const dropDownInput of questionInput.dropDown) {
                    const dropDown = new DropDown();
                    dropDown.text = dropDownInput.text;
                    dropDown.value = dropDownInput.value;
                    dropDown.reviewQuestion = question;
                    await dropDown.save();
                }
            }
        }

        const result = await ReviewCampaign.findOne({
            where: { id: campaign.id },
            relations: ["questions", "questions.dropDown"]
        });

        return { reviewCampaign: result };
    }

    @Mutation(() => ReviewCampaign)
    @UseMiddleware(isAuth)
    async updateReviewCampaign(@Arg("input") input: UpdateReviewCampaignInput) {
        const campaign = await ReviewCampaign.findOne({ where: { id: input.id } });
        if (!campaign) {
            throw new Error("Review campaign not found");
        }

        if (input.title !== undefined) campaign.title = input.title;
        if (input.description !== undefined) campaign.description = input.description;
        if (input.startDate !== undefined) campaign.startDate = input.startDate ? new Date(input.startDate) : null;
        if (input.endDate !== undefined) campaign.endDate = input.endDate ? new Date(input.endDate) : null;
        if (input.for !== undefined) campaign.for = input.for;
        if (input.for_id !== undefined) campaign.for_id = input.for_id;

        await campaign.save();
        return campaign;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteReviewCampaign(@Arg("id") id: string) {
        const campaign = await ReviewCampaign.findOne({ where: { id } });
        if (!campaign) {
            throw new Error("Review campaign not found");
        }

        await campaign.remove();
        return true;
    }

    // Question Mutations
    @Mutation(() => ReviewQuestion)
    @UseMiddleware(isAuth)
    async addQuestionToCampaign(@Arg("input") input: AddQuestionToCampaignInput) {
        const campaign = await ReviewCampaign.findOne({ where: { id: input.campaignId } });
        if (!campaign) {
            throw new Error("Review campaign not found");
        }

        const question = ReviewQuestion.create({
            question: input.question.question,
            questionType: input.question.questionType,
            rangeMin: input.question.rangeMin,
            rangeMax: input.question.rangeMax,
            reviewCampaign: campaign
        });

        await question.save();

        // Create dropdown options if needed
        if (input.question.dropDown && input.question.questionType === "dropdown") {
            for (const dropDownInput of input.question.dropDown) {
                const dropDown = DropDown.create({
                    text: dropDownInput.text,
                    value: dropDownInput.value,
                    reviewQuestion: question
                });
                await dropDown.save();
            }
        }

        return question;
    }

    @Mutation(() => ReviewQuestion)
    @UseMiddleware(isAuth)
    async updateQuestion(@Arg("input") input: UpdateQuestionInput) {
        const question = await ReviewQuestion.findOne({ where: { id: input.id } });
        if (!question) {
            throw new Error("Question not found");
        }

        if (input.question !== undefined) question.question = input.question;
        if (input.questionType !== undefined) question.questionType = input.questionType;
        if (input.rangeMin !== undefined) question.rangeMin = input.rangeMin;
        if (input.rangeMax !== undefined) question.rangeMax = input.rangeMax;

        await question.save();

        // Update dropdown options if provided
        if (input.dropDown) {
            // Remove existing dropdown options
            await DropDown.delete({ reviewQuestion: { id: question.id } });

            // Create new dropdown options
            for (const dropDownInput of input.dropDown) {
                const dropDown = DropDown.create({
                    text: dropDownInput.text,
                    value: dropDownInput.value,
                    reviewQuestion: question
                });
                await dropDown.save();
            }
        }

        return question;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteQuestion(@Arg("id") id: string) {
        const question = await ReviewQuestion.findOne({ where: { id } });
        if (!question) {
            throw new Error("Question not found");
        }

        await question.remove();
        return true;
    }

    // Review Mutations
    @Mutation(() => Review)
    async submitReview(@Arg("input") input: SubmitReviewInput) {
        const campaign = await ReviewCampaign.findOne({ where: { id: input.campaignId } });
        if (!campaign) {
            throw new Error("Review campaign not found");
        }

        const review = new Review();
        review.reviewCampaign = campaign;
        review.dateReviewCompleted = new Date();

        await review.save();

        // Create answers
        for (const answerInput of input.answers) {
            const answer = new ReviewAnswer();
            answer.review = review;
            answer.questionId = { id: answerInput.questionId } as ReviewQuestion;
            answer.questionType = answerInput.questionType;
            answer.textAnswer = answerInput.textAnswer || "";
            answer.rangeAnswer = answerInput.rangeAnswer || 0;
            answer.dropDownAnswer = answerInput.dropDownAnswerId ? { id: answerInput.dropDownAnswerId } as DropDown : null;

            await answer.save();
        }

        return review;
    }

    @Mutation(() => Review)
    async updateReview(@Arg("input") input: UpdateReviewInput) {
        const review = await Review.findOne({ where: { id: input.reviewId } });
        if (!review) {
            throw new Error("Review not found");
        }

        // Remove existing answers
        await ReviewAnswer.delete({ review: { id: review.id } });

        // Create new answers
        for (const answerInput of input.answers) {
            const answer = new ReviewAnswer();
            answer.review = review;
            answer.questionId = { id: answerInput.questionId } as ReviewQuestion;
            answer.questionType = answerInput.questionType;
            answer.textAnswer = answerInput.textAnswer || "";
            answer.rangeAnswer = answerInput.rangeAnswer || 0;
            answer.dropDownAnswer = answerInput.dropDownAnswerId ? { id: answerInput.dropDownAnswerId } as DropDown : null;

            await answer.save();
        }

        return review;
    }

    // Review Queries
    @Query(() => [Review])
    async getReviewsForCampaign(@Arg("campaignId") campaignId: string) {
        return await Review.find({
            where: { reviewCampaign: { id: campaignId } },
            relations: ["answers", "answers.questionId", "answers.dropDownAnswer"]
        });
    }

    @Query(() => Review, { nullable: true })
    async getReview(@Arg("id") id: string) {
        return await Review.findOne({
            where: { id },
            relations: ["answers", "answers.questionId", "answers.dropDownAnswer"]
        });
    }
}
