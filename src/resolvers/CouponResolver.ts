import { Resolver, Query, Mutation, Arg } from "type-graphql";
import * as models from '../models';
import { Utils } from '../utils';

@Resolver()
export class CouponResolver {

    @Mutation(() => models.CouponResponse)
    async createCoupon(@Arg('token') token: string, @Arg('input', () => models.CreateCouponInput) input: models.CreateCouponInput) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let event = await models.Events.findOne({ where: { id: input.eventId, organizer: { id: org.id } } });

        if (!event) return new Utils.CustomError("Event does not exist");

        // Generate coupon code if empty
        let couponCode = input.code;
        if (!couponCode || couponCode.trim() === '') {
            couponCode = await this.generateUniqueCouponCode();
        }

        // Check if coupon code already exists
        const existingCoupon = await models.Coupon.findOne({ where: { code: couponCode } });
        if (existingCoupon) return new Utils.CustomError("Coupon code already exists");

        let specificTicket = null;
        if (input.specificTicketId && !input.appliesToAllTickets) {
            specificTicket = await models.EventTickets.findOne({ where: { id: input.specificTicketId, event: { id: input.eventId } } });
            if (!specificTicket) return new Utils.CustomError("Specific ticket not found");
        }

        const coupon = await models.Coupon.create({
            code: couponCode.toUpperCase(),
            description: input.description,
            discountAmount: input.discountAmount,
            discountType: input.discountType,
            maxUses: input.maxUses,
            currentUses: 0,
            active: true,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            appliesToAllTickets: input.appliesToAllTickets,
            event: { id: input.eventId },
            specificTicket: specificTicket
        }).save();

        return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            maxUses: coupon.maxUses,
            currentUses: coupon.currentUses,
            active: coupon.active,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            appliesToAllTickets: coupon.appliesToAllTickets,
            specificTicketId: coupon.specificTicket?.id,
            specificTicketTitle: coupon.specificTicket?.title,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        };
    }

    @Mutation(() => String)
    async generateCouponCode(@Arg('token') token: string) {
        // Verify organizer token
        await Utils.getOrganizerFromJsWebToken(token);

        const couponCode = await this.generateUniqueCouponCode();
        return couponCode;
    }

    private async generateUniqueCouponCode(): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const codeLength = 8;
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            let code = '';
            for (let i = 0; i < codeLength; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            // Check if code already exists
            const existingCoupon = await models.Coupon.findOne({ where: { code: code } });
            if (!existingCoupon) {
                return code;
            }

            attempts++;
        }

        // If we can't generate a unique code after max attempts, add timestamp
        const timestamp = Date.now().toString().slice(-4);
        const baseCode = 'CPN' + timestamp;
        return baseCode;
    }

    @Mutation(() => models.CouponResponse)
    async updateCoupon(@Arg('token') token: string, @Arg('input', () => models.UpdateCouponInput) input: models.UpdateCouponInput) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let coupon = await models.Coupon.findOne({
            where: { id: input.id },
            relations: ['event', 'specificTicket']
        });

        if (!coupon) return new Utils.CustomError("Coupon not found");

        if (coupon.event.organizer.id !== org.id) return new Utils.CustomError("Unauthorized");

        if (input.code) {
            const existingCoupon = await models.Coupon.findOne({
                where: { code: input.code, id: { not: input.id } as any }
            });
            if (existingCoupon) return new Utils.CustomError("Coupon code already exists");
            coupon.code = input.code.toUpperCase();
        }

        if (input.description !== undefined) coupon.description = input.description;
        if (input.discountAmount !== undefined) coupon.discountAmount = input.discountAmount;
        if (input.discountType !== undefined) coupon.discountType = input.discountType;
        if (input.maxUses !== undefined) coupon.maxUses = input.maxUses;
        if (input.active !== undefined) coupon.active = input.active;
        if (input.validFrom !== undefined) coupon.validFrom = input.validFrom;
        if (input.validUntil !== undefined) coupon.validUntil = input.validUntil;
        if (input.appliesToAllTickets !== undefined) coupon.appliesToAllTickets = input.appliesToAllTickets;

        if (input.specificTicketId !== undefined) {
            if (input.specificTicketId && !input.appliesToAllTickets) {
                const specificTicket = await models.EventTickets.findOne({
                    where: { id: input.specificTicketId, event: { id: coupon.event.id } }
                });
                if (!specificTicket) return new Utils.CustomError("Specific ticket not found");
                coupon.specificTicket = specificTicket;
            } else {
                coupon.specificTicket = null;
            }
        }

        await coupon.save();

        return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            maxUses: coupon.maxUses,
            currentUses: coupon.currentUses,
            active: coupon.active,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            appliesToAllTickets: coupon.appliesToAllTickets,
            specificTicketId: coupon.specificTicket?.id,
            specificTicketTitle: coupon.specificTicket?.title,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        };
    }

    @Mutation(() => String)
    async deleteCoupon(@Arg('token') token: string, @Arg('id') id: string) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let coupon = await models.Coupon.findOne({
            where: { id },
            relations: ['event']
        });

        if (!coupon) return new Utils.CustomError("Coupon not found");

        if (coupon.event.organizer.id !== org.id) return new Utils.CustomError("Unauthorized");

        await coupon.remove();

        return "Coupon deleted successfully";
    }

    @Query(() => models.CouponValidationResponse)
    async validateCoupon(@Arg('input', () => models.ValidateCouponInput) input: models.ValidateCouponInput) {
        const coupon = await models.Coupon.findOne({
            where: { code: input.code.toUpperCase() },
            relations: ['event', 'specificTicket']
        });

        if (!coupon) {
            return {
                valid: false,
                message: "Invalid coupon code"
            };
        }

        if (!coupon.active) {
            return {
                valid: false,
                message: "Coupon is inactive"
            };
        }

        if (coupon.event.id !== input.eventId) {
            return {
                valid: false,
                message: "Coupon is not valid for this event"
            };
        }

        if (coupon.currentUses >= coupon.maxUses) {
            return {
                valid: false,
                message: "Coupon usage limit exceeded"
            };
        }

        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return {
                valid: false,
                message: "Coupon is not yet valid"
            };
        }

        if (coupon.validUntil && now > coupon.validUntil) {
            return {
                valid: false,
                message: "Coupon has expired"
            };
        }

        if (!coupon.appliesToAllTickets && input.ticketId) {
            if (coupon.specificTicket?.id !== input.ticketId) {
                return {
                    valid: false,
                    message: "Coupon is not valid for this ticket type"
                };
            }
        }

        return {
            valid: true,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            couponId: coupon.id
        };
    }

    @Query(() => models.CouponListResponse)
    async getEventCoupons(@Arg('token') token: string, @Arg('eventId') eventId: string) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: org.id } } });

        if (!event) return new Utils.CustomError("Event not found");

        const coupons = await models.Coupon.find({
            where: { event: { id: eventId } },
            relations: ['specificTicket'],
            order: { createdAt: 'DESC' }
        });

        const couponResponses = coupons.map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            maxUses: coupon.maxUses,
            currentUses: coupon.currentUses,
            active: coupon.active,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            appliesToAllTickets: coupon.appliesToAllTickets,
            specificTicketId: coupon.specificTicket?.id,
            specificTicketTitle: coupon.specificTicket?.title,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        }));

        return {
            coupons: couponResponses,
            total: couponResponses.length
        };
    }

    @Query(() => models.CouponResponse)
    async getCoupon(@Arg('token') token: string, @Arg('id') id: string) {
        let org = await Utils.getOrganizerFromJsWebToken(token);

        let coupon = await models.Coupon.findOne({
            where: { id },
            relations: ['event', 'specificTicket']
        });

        if (!coupon) return new Utils.CustomError("Coupon not found");

        if (coupon.event.organizer.id !== org.id) return new Utils.CustomError("Unauthorized");

        return {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            maxUses: coupon.maxUses,
            currentUses: coupon.currentUses,
            active: coupon.active,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            appliesToAllTickets: coupon.appliesToAllTickets,
            specificTicketId: coupon.specificTicket?.id,
            specificTicketTitle: coupon.specificTicket?.title,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        };
    }
} 