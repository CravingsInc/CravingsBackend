import { ObjectType, InputType, Field, ID } from "type-graphql";
import { DiscountType } from "../../organizers/events/discount";

@InputType()
export class CreateDiscountInput {
    @Field() code: string;

    @Field( () => DiscountType ) discountType: DiscountType;

    @Field({ nullable: true }) value: number;

    @Field({ nullable: true }) maxUsage: number;

    @Field({ nullable: true }) isActive: boolean;
}
