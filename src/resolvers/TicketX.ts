import { Resolver, Mutation, Query, Arg, Args } from "type-graphql";
import { Equal, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual } from "typeorm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class TicketX {
    @Mutation( () => models.EventDiscountsCodes )
    async createDiscountCode( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg( 'args', () => models.CreateDiscountInput ) args: models.CreateDiscountInput ): Promise<models.EventDiscountsCodes> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], true ); // Needs to be an admin to create discount code.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } } });
        if (!event) throw new Utils.CustomError("Event not found");

        const existingCode = await models.EventDiscountsCodes.findOne({ where: { code: args.code, event: { id: event.id } } });
        if (existingCode) throw new Utils.CustomError("Code already exists");

        const discount = await models.EventDiscountsCodes.create({
            code: args.code,
            discountType: args.discountType,
            value: args.value || 0,
            maxUsage: args.maxUsage || null,
            isActive: true,
            usageCount: 0,
            event: event

        return discount;

    }

    @Query( () => [models.EventDiscountsCodes] )
    async getEventDiscountCodes( @Arg('token') token: string, @Arg('eventId') eventId: string ): Promise<models.EventDiscountsCodes[]> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], false );

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } }, relations: ['organizer'] });
        if (!event) throw new Utils.CustomError("Event not found");
        if (event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to view this event's discounts");

        const discounts = await models.EventDiscountsCodes.find({ where: { event: { id: event.id } }, relations: ['event', 'rules', 'rules.applicableTickets', 'rules.applicableTickets.ticket'] });

        return discounts;
    }

    @Mutation( () => models.EventDiscountsCodes )
    async modifyDiscountCode( @Arg('token') token: string, @Arg('discountId') discountId: string, @Arg( 'args', () => models.CreateDiscountInput ) args: models.CreateDiscountInput ): Promise<models.EventDiscountsCodes> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], true ); // Needs to be an admin to modify discount code.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id }} }, relations: ['event', 'event.organizer'] });
        
        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        if (args.code) {
            const existingCode = await models.EventDiscountsCodes.findOne({ where: { code: args.code, event: { id: discount.event.id } } });
            
            if (existingCode && existingCode.id !== discount.id) throw new Utils.CustomError("Code already exists");
            
            discount.code = args.code;
        }

        if (args.discountType) discount.discountType = args.discountType;
        if (args.value !== undefined) discount.value = args.value;
        if (args.isActive !== undefined) discount.isActive = args.isActive;
        if (args.maxUsage !== undefined) discount.maxUsage = args.maxUsage;

        await discount.save();

        return discount;
    }

    @Mutation( () => [ models.DiscountRuleset ])
    async createDiscountRuleset( @Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('ruleset') ruleset: models.DiscountRuleset, @Arg('applicableTickets', { nullable : true }) applicableTickets?: string[], @Arg('timedValue', { nullable: true }) timedValue?: Date ): Promise<models.EventDiscountsCodesRuleset[]> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], true ); // Needs to be an admin to create discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id }} }, relations: ['event', 'event.organizer'] });
        
        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        let newRulesetList: models.EventDiscountsCodesRuleset[] = [];
        
        if ( ruleset === models.DiscountRuleset.TIMED_DISCOUNT && timedValue ) {
            const newRuleset = await models.EventDiscountsCodesRuleset.create({
                ruleset,
                timedValue: ruleset === models.DiscountRuleset.TIMED_DISCOUNT ? timedValue || null : null,
                discount
            }).save();
            
            newRulesetList.push(newRuleset);
        }else if ( ruleset === models.DiscountRuleset.TICKET_DISCOUNT && applicableTickets && applicableTickets.length > 0 ) {
            for ( const ticketId of applicableTickets ) {
                const ticket = await models.EventTickets.findOne({ where: { id: ticketId, event: { id: discount.event.id } }, relations: ['event'] });
                
                if ( !ticket ) throw new Utils.CustomError(`Ticket with ID ${ticketId} not found`);
                if ( ticket.event.id !== discount.event.id ) throw new Utils.CustomError(`Ticket with ID ${ticketId} does not belong to the same event as the discount`);

                const ruleSetExist = await models.EventDiscountsCodesRuleset.findOne({ where: { applicableTickets: { ticket: { id: ticket.id } }, discount: { id: discount.id } } })

                if ( ruleSetExist ) {
                    newRulesetList.push(ruleSetExist);
                    continue;
                }

                const newRuleset = await models.EventDiscountsCodesRuleset.create({
                    ruleset,
                    timedValue: null,
                    discount
                }).save();

                await models.DiscountApplicableTickets.create({
                    ruleset: newRuleset,
                    ticket
                }).save();

                newRulesetList.push(newRuleset);
            }
        }

        return newRulesetList;
    }

    @Mutation( () => models.EventDiscountsCodesRuleset )
    async modifyDiscountCodeRuleSet( @Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('rulesetId') rulesetId: string, @Arg('newDate') newDate: Date ): Promise<models.EventDiscountsCodesRuleset> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], true ); // Needs to be an admin to modify discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id }} }, relations: ['event', 'event.organizer'] });
        
        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        const ruleset = await models.EventDiscountsCodesRuleset.findOne({ where: { id: rulesetId, discount: { id: discount.id } }, relations: ['discount', 'discount.event', 'discount.event.organizer'] });

        if ( !ruleset ) throw new Utils.CustomError("Ruleset not found");
        if ( ruleset.discount.event.organizer.id !== organizer.id ) throw new Utils.CustomError("You do not have permission to modify this ruleset");

        if ( ruleset.ruleset !== models.DiscountRuleset.TIMED_DISCOUNT ) throw new Utils.CustomError("Only TIMED_DISCOUNT rulesets can be modified");

        ruleset.timedValue = newDate;

        await ruleset.save();

        return ruleset;
    }

    @Mutation( () => String )
    async deleteDiscountCodeRuleSet( @Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('rulesetId') rulesetId: string ) {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken( token, [], true ); // Needs to be an admin to delete discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id }} }, relations: ['event', 'event.organizer'] });
        
        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        const ruleset = await models.EventDiscountsCodesRuleset.findOne({ where: { id: rulesetId, discount: { id: discount.id } }, relations: ['discount', 'discount.event', 'discount.event.organizer'] });

        if ( !ruleset ) throw new Utils.CustomError("Ruleset not found");
        if ( ruleset.discount.event.organizer.id !== organizer.id ) throw new Utils.CustomError("You do not have permission to modify this ruleset");

        await ruleset.remove();

        return "Ruleset deleted successfully";
    }
}
