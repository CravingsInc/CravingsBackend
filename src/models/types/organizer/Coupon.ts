import { ObjectType, InputType, Field, ID } from "type-graphql";

@InputType()
export class CreateCouponInput {
    @Field() eventId: string;

    @Field() code: string;

    @Field() description: string;

    @Field() discountAmount: number;

    @Field({ defaultValue: 'percentage' })
    discountType: 'percentage' | 'fixed';

    @Field({ defaultValue: 1 })
    maxUses: number;

    @Field({ nullable: true })
    validFrom?: Date;

    @Field({ nullable: true })
    validUntil?: Date;

    @Field({ defaultValue: false })
    appliesToAllTickets: boolean;

    @Field({ nullable: true })
    specificTicketId?: string;
}

@InputType()
export class UpdateCouponInput {
    @Field() id: string;

    @Field({ nullable: true })
    code?: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    discountAmount?: number;

    @Field({ nullable: true })
    discountType?: 'percentage' | 'fixed';

    @Field({ nullable: true })
    maxUses?: number;

    @Field({ nullable: true })
    active?: boolean;

    @Field({ nullable: true })
    validFrom?: Date;

    @Field({ nullable: true })
    validUntil?: Date;

    @Field({ nullable: true })
    appliesToAllTickets?: boolean;

    @Field({ nullable: true })
    specificTicketId?: string;
}

@InputType()
export class ValidateCouponInput {
    @Field() eventId: string;

    @Field() code: string;

    @Field({ nullable: true })
    ticketId?: string;
}

@ObjectType()
export class CouponValidationResponse {
    @Field() valid: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    discountAmount?: number;

    @Field({ nullable: true })
    discountType?: 'percentage' | 'fixed';

    @Field({ nullable: true })
    couponId?: string;
}

@ObjectType()
export class CouponResponse {
    @Field(() => ID) id: string;

    @Field() code: string;

    @Field() description: string;

    @Field() discountAmount: number;

    @Field() discountType: 'percentage' | 'fixed';

    @Field() maxUses: number;

    @Field() currentUses: number;

    @Field() active: boolean;

    @Field({ nullable: true })
    validFrom?: Date;

    @Field({ nullable: true })
    validUntil?: Date;

    @Field() appliesToAllTickets: boolean;

    @Field({ nullable: true })
    specificTicketId?: string;

    @Field({ nullable: true })
    specificTicketTitle?: string;

    @Field() createdAt: Date;

    @Field() updatedAt: Date;
}

@ObjectType()
export class CouponListResponse {
    @Field(() => [CouponResponse]) coupons: CouponResponse[];

    @Field() total: number;
} 