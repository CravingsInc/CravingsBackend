import { Resolver, Mutation, Query, Arg, Args } from "type-graphql";
import { Equal, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual } from "typeorm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class TicketX {
    @Mutation(() => models.EventDiscountsCodes)
    async createDiscountCode(@Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('args', () => models.CreateDiscountInput) args: models.CreateDiscountInput): Promise<models.EventDiscountsCodes> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to create discount code.

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
        });

        return discount;
    }

    @Query(() => [models.EventDiscountsCodes])
    async getEventDiscountCodes(@Arg('token') token: string, @Arg('eventId') eventId: string): Promise<models.EventDiscountsCodes[]> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], false);

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } }, relations: ['organizer'] });
        if (!event) throw new Utils.CustomError("Event not found");
        if (event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to view this event's discounts");

        const discounts = await models.EventDiscountsCodes.find({ where: { event: { id: event.id } }, relations: ['event', 'rules', 'rules.applicableTickets', 'rules.applicableTickets.ticket'] });

        return discounts;
    }

    @Mutation(() => models.EventDiscountsCodes)
    async modifyDiscountCode(@Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('args', () => models.CreateDiscountInput) args: models.CreateDiscountInput): Promise<models.EventDiscountsCodes> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to modify discount code.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id } } }, relations: ['event', 'event.organizer'] });

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

    @Mutation(() => [models.DiscountRuleset])
    async createDiscountRuleset(@Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('ruleset') ruleset: models.DiscountRuleset, @Arg('applicableTickets', { nullable: true }) applicableTickets?: string[], @Arg('timedValue', { nullable: true }) timedValue?: Date): Promise<models.EventDiscountsCodesRuleset[]> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to create discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id } } }, relations: ['event', 'event.organizer'] });

        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        let newRulesetList: models.EventDiscountsCodesRuleset[] = [];

        if (ruleset === models.DiscountRuleset.TIMED_DISCOUNT && timedValue) {
            const newRuleset = await models.EventDiscountsCodesRuleset.create({
                ruleset,
                timedValue: ruleset === models.DiscountRuleset.TIMED_DISCOUNT ? timedValue || null : null,
                discount
            }).save();

            newRulesetList.push(newRuleset);
        } else if (ruleset === models.DiscountRuleset.TICKET_DISCOUNT && applicableTickets && applicableTickets.length > 0) {
            for (const ticketId of applicableTickets) {
                const ticket = await models.EventTickets.findOne({ where: { id: ticketId, event: { id: discount.event.id } }, relations: ['event'] });

                if (!ticket) throw new Utils.CustomError(`Ticket with ID ${ticketId} not found`);
                if (ticket.event.id !== discount.event.id) throw new Utils.CustomError(`Ticket with ID ${ticketId} does not belong to the same event as the discount`);

                const ruleSetExist = await models.EventDiscountsCodesRuleset.findOne({ where: { applicableTickets: { ticket: { id: ticket.id } }, discount: { id: discount.id } } })

                if (ruleSetExist) {
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

    @Mutation(() => models.EventDiscountsCodesRuleset)
    async modifyDiscountCodeRuleSet(@Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('rulesetId') rulesetId: string, @Arg('newDate') newDate: Date): Promise<models.EventDiscountsCodesRuleset> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to modify discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id } } }, relations: ['event', 'event.organizer'] });

        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        const ruleset = await models.EventDiscountsCodesRuleset.findOne({ where: { id: rulesetId, discount: { id: discount.id } }, relations: ['discount', 'discount.event', 'discount.event.organizer'] });

        if (!ruleset) throw new Utils.CustomError("Ruleset not found");
        if (ruleset.discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this ruleset");

        if (ruleset.ruleset !== models.DiscountRuleset.TIMED_DISCOUNT) throw new Utils.CustomError("Only TIMED_DISCOUNT rulesets can be modified");

        ruleset.timedValue = newDate;

        await ruleset.save();

        return ruleset;
    }

    @Mutation(() => String)
    async deleteDiscountCodeRuleSet(@Arg('token') token: string, @Arg('discountId') discountId: string, @Arg('rulesetId') rulesetId: string): Promise<string> {
        const organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to delete discount ruleset.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        const discount = await models.EventDiscountsCodes.findOne({ where: { id: discountId, event: { organizer: { id: organizer.id } } }, relations: ['event', 'event.organizer'] });

        if (!discount) throw new Utils.CustomError("Discount not found");
        if (discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this discount");

        const ruleset = await models.EventDiscountsCodesRuleset.findOne({ where: { id: rulesetId, discount: { id: discount.id } }, relations: ['discount', 'discount.event', 'discount.event.organizer'] });

        if (!ruleset) throw new Utils.CustomError("Ruleset not found");
        if (ruleset.discount.event.organizer.id !== organizer.id) throw new Utils.CustomError("You do not have permission to modify this ruleset");

        await ruleset.remove();

        return "Ruleset deleted successfully";
    }

    @Mutation(() => String)
    async createPaidTicketClientSecret(@Arg('eventId') eventId: string, @Arg('userToken', { nullable: true }) userToken?: string) {
        let user: models.Users | null = null;

        try {
            user = await Utils.getUserFromJsWebToken(userToken || "");
        } catch (e) { console.log(e); }

        let event = await models.Events.findOne({ where: { id: eventId }, relations: ['organizer', 'prices'] });

        if (!event) return new Utils.CustomError("Event not found.");

        if (!event.visible) return new Utils.CustomError("Event not found.");

        if (event.type !== models.EventType.PAID_TICKET) return new Utils.CustomError("Wrong type of Event.")

        let cart = await models.EventTicketCart.create({
            completed: false,
            eventId: event.id,
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
            user
        }).save();


        return cart.id
    }

    @Mutation(() => models.UpdatePaymentIntentResponse)
    async updatePaidTicketClientSecret(
        @Arg('cartId') cartId: string,
        @Arg('prices', () => [models.TicketBuyClientSecretUpdate]) prices: models.TicketBuyClientSecretUpdate[],
        @Arg('couponCodes', () => [String], { nullable: true }) couponCodes?: string[],
    ) {
        const cart = await models.EventTicketCart.findOne({
            where: {
                id: cartId
            },
            relations: ['appliedDiscountCodes', 'appliedDiscountCodes.discountCode']
        })

        if (!cart) return new Utils.CustomError("Cart not found.");
        if (cart.completed) return new Utils.CustomError("Cart already completed.");

        const event = await models.Events.findOne({ where: { id: cart.eventId }, relations: ['organizer', 'prices'] });

        if (!event || !event.visible || !event.organizer.stripeAccountVerified) return new Utils.CustomError("Event not found.");
        if (event.type !== models.EventType.PAID_TICKET) return new Utils.CustomError("Wrong type of Event.")


        const cartItems: Array<{ ticketId: string; quantity: number; unitPrice: number }> = [];

        for (let price of prices) {
            let ticket = await models.EventTickets.findOne({ where: { priceId: price.id }, relations: ['event'] });

            if (!ticket) return new Utils.CustomError("Ticket not found.");
            if (ticket.event.id !== cart.eventId) return new Utils.CustomError("Ticket not for this event.");

            let ticketSold = await models.EventTicketBuys.countBy({ eventTicket: { id: ticket.id }, cart: { completed: true } });

            if (ticketSold + price.quantity > ticket.totalTicketAvailable) return new Utils.CustomError("Not enough tickets available.");

            cartItems.push({
                ticketId: ticket.id,
                quantity: price.quantity,
                unitPrice: ticket.amount
            })
        }

        const subtotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

        const codesToApply = couponCodes || cart.appliedDiscountCodes?.map(adc => adc.discountCode.code) || [];

        let discountResult: any = null;
        let finalAmount = subtotal;

        if (codesToApply.length > 0) {
            try {
                discountResult = await Utils.DISCOUNT_SERVICE.validateAndApplyDiscounts(codesToApply, cart.eventId, cartItems);
                finalAmount = discountResult.finalAmount;
            } catch (err: any) {
                return new Utils.CustomError(err.message)
            }
        }

        cart.subtotal = subtotal;
        cart.totalDiscount = discountResult?.totalDiscount || 0;
        cart.total = finalAmount;
        await cart.save();

        if (cart.appliedDiscountCodes) {
            for (const appliedDiscount of cart.appliedDiscountCodes) {
                await appliedDiscount.remove();
            }
        }

        if (discountResult) {
            for (const appliedDiscount of discountResult.discounts) {
                const discountRecord = await models.EventAppliedDiscountCodes.create({
                    discountCode: appliedDiscount.discount,
                    cart: cart,
                    appliedValue: appliedDiscount.amount,
                    appliedType: appliedDiscount.discount.discountType,
                    originalPrice: subtotal,
                    finalPrice: finalAmount
                }).save()
            }
        }

        let clientSecret: string | null = null;

        if (finalAmount > 0 && event.organizer.stripeAccountVerified) {
            if (cart.stripeTransactionId) {
                clientSecret = (await stripeHandler.updatePaymentIntent(cart.stripeTransactionId, prices, event.organizer.stripeConnectId, event.type, discountResult)).client_secret;
            } else {
                clientSecret = (await stripeHandler.createPaymentIntent(event.organizer.stripeConnectId, event.id, prices, cart.user ? cart.user.stripeCustomerId : undefined, event.type, discountResult, cart.id)).client_secret;
            }
        }

        return {
            client_secret: clientSecret,
            cartId: cart.id,
            subtotal,
            totalDiscount: discountResult?.totalDiscount || 0,
            total: finalAmount,
            appliedDiscounts: discountResult?.appliedCodes || []
        }
    }

    @Mutation(() => models.UpdatePaymentIntentResponse)
    async addDiscountToCart(
        @Arg('cartId') cartId: string,
        @Arg('couponCode') couponCode: string
    ) {
        const cart = await models.EventTicketCart.findOne({
            where: { id: cartId },
            relations: ['appliedDiscountCodes', 'appliedDiscountCodes.discountCode', 'tickets']
        });

        if (!cart) return new Utils.CustomError("Cart not found.");
        if (cart.completed) return new Utils.CustomError("Cart already completed.");

        const event = await models.Events.findOne({
            where: { id: cart.eventId },
            relations: ['organizer']
        });

        if (!event || !event.visible) return new Utils.CustomError("Event not found.");

        // Get current cart items from tickets
        const cartItems: Array<{ ticketId: string; quantity: number; unitPrice: number }> = [];
        for (const ticketBuy of cart.tickets || []) {
            cartItems.push({
                ticketId: ticketBuy.eventTicket.priceId,
                quantity: ticketBuy.quantity,
                unitPrice: ticketBuy.unitPrice
            });
        }

        if (cartItems.length === 0) {
            return new Utils.CustomError("No tickets in cart to apply discount to.");
        }

        // Get existing coupon codes and add new one
        const existingCodes = cart.appliedDiscountCodes?.map(adc => adc.discountCode.code) || [];
        const newCodes = [...existingCodes, couponCode];

        // Call the update function with new codes
        return this.updatePaidTicketClientSecret(cartId, cartItems.map(item => ({
            id: item.ticketId,
            quantity: item.quantity
        })), newCodes);
    }

    @Mutation(() => models.UpdatePaymentIntentResponse)
    async removeDiscountFromCart(
        @Arg('cartId') cartId: string,
        @Arg('couponCode') couponCode: string
    ) {
        const cart = await models.EventTicketCart.findOne({
            where: { id: cartId },
            relations: ['appliedDiscountCodes', 'appliedDiscountCodes.discountCode', 'tickets']
        });

        if (!cart) return new Utils.CustomError("Cart not found.");
        if (cart.completed) return new Utils.CustomError("Cart already completed.");

        // Remove the specific discount code
        const discountToRemove = cart.appliedDiscountCodes?.find(
            adc => adc.discountCode.code === couponCode
        );

        if (discountToRemove) {
            await discountToRemove.remove();
        }

        // Get current cart items
        const cartItems: Array<{ ticketId: string; quantity: number; unitPrice: number }> = [];
        for (const ticketBuy of cart.tickets || []) {
            cartItems.push({
                ticketId: ticketBuy.eventTicket.id,
                quantity: ticketBuy.quantity,
                unitPrice: ticketBuy.unitPrice
            });
        }

        // Get remaining coupon codes
        const remainingCodes = cart.appliedDiscountCodes
            ?.filter(adc => adc.discountCode.code !== couponCode)
            .map(adc => adc.discountCode.code) || [];

        // Recalculate with remaining codes
        return this.updatePaidTicketClientSecret(cartId, cartItems.map(item => ({
            id: item.ticketId, // Adjust to use priceId
            quantity: item.quantity
        })), remainingCodes);
    }

    @Query(() => models.CartDetails)
    async getCartDetails(@Arg('cartId') cartId: string) {
        const cart = await models.EventTicketCart.findOne({
            where: { id: cartId },
            relations: [
                'appliedDiscountCodes',
                'appliedDiscountCodes.discountCode',
                'tickets',
                'tickets.eventTicket'
            ]
        });

        if (!cart) throw new Utils.CustomError("Cart not found.");

        const items: models.CartItem[] = (cart.tickets || []).map(ticket => ({
            ticketId: ticket.eventTicket.id,
            name: ticket.eventTicket.title,
            quantity: ticket.quantity,
            unitPrice: ticket.unitPrice,
            totalPrice: ticket.totalPrice,
            discountAmount: ticket.discountAmount
        }));

        return {
            id: cart.id,
            subtotal: cart.subtotal,
            totalDiscount: cart.totalDiscount,
            total: cart.total,
            appliedDiscounts: cart.appliedDiscountCodes?.map(adc => adc.discountCode.code) || [],
            items
        };
    }

    @Mutation(() => String)
    async finalizeCartWithUserInfo(
        @Arg('cartId') cartId: string,
        @Arg('name') name: string,
        @Arg('email') email: string,
        @Arg('phone', { nullable: true }) phone?: string,
        @Arg('userToken', { nullable: true }) userToken?: string
    ) {
        const cart = await models.EventTicketCart.findOne({
            where: { id: cartId },
            relations: ['appliedDiscountCodes', 'tickets', 'tickets.eventTicket']
        });

        if (!cart) return new Utils.CustomError("Cart not found.");
        if (cart.completed) return new Utils.CustomError("Cart already completed.");

        let user: models.Users | null = null;
        try {
            user = await Utils.getUserFromJsWebToken(userToken || "");
        } catch (e) { console.log(e); }

        // Update cart with user info
        cart.name = name;
        cart.email = email;
        cart.type = user ? 'user' : 'guest';
        cart.user = user || null;

        // Update Stripe payment intent with customer information
        if (cart.stripeTransactionId && cart.total > 0) {
            const event = await models.Events.findOne({
                where: { id: cart.eventId },
                relations: ['organizer']
            });

            if (event && event.organizer.stripeAccountVerified) {
                let stripeCustomerId: string | undefined;

                // Find or create Stripe customer
                if (user?.stripeCustomerId) {
                    stripeCustomerId = user.stripeCustomerId;
                } else {
                    // Create new Stripe customer
                    const customer = await stripeHandler.createCustomer(
                        email,
                        user && user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : name,
                        phone || '',
                        'user',
                        event.organizer.stripeConnectId,
                        { cartId: cart.id, eventId: cart.eventId }
                    );
                    stripeCustomerId = customer.id;

                    // Save to user if logged in
                    if (user && stripeCustomerId) {
                        user.stripeCustomerId = stripeCustomerId;
                        await user.save();
                    }
                }

                stripeHandler.addCustomerToPaymentIntent(cart.stripeTransactionId, stripeCustomerId || '', event.organizer.stripeConnectId, { name, email, phone: phone || '' })
            }
        }

        await cart.save();

        return "User information added successfully";
    }

    @Mutation(() => models.CreateTicketSellClientSecretResponse)
    async createCYOPClientSecret(@Arg('eventId') eventId: string, @Arg('price') price: number, @Arg('userToken', { nullable: true }) userToken?: string) {
        let user: models.Users | null = null;

        try {
            user = await Utils.getUserFromJsWebToken(userToken || "");
        } catch (e) { console.log(e); }

        let event = await models.Events.findOne({ where: { id: eventId }, relations: ['organizer'] });

        if (!event) return new Utils.CustomError("Event not found.");

        if (!event.visible) return new Utils.CustomError("Event not found.");

        if (event.type !== models.EventType.CYOP) return new Utils.CustomError("Wrong type of Event.");

        let cyopTicket = await models.EventTickets.findOne({ where: { id: event.cyop_id } });

        if (!cyopTicket) return new Utils.CustomError("Event not found.");

        // Case 1: This is a FREE CYOP ticket (configured with 0,0)
        if (cyopTicket.minPrice === 0 && cyopTicket.maxPrice === 0) {
            // The only acceptable price for a free ticket is 0.
            if (price !== 0) {
                return new Utils.CustomError("This is a free event. The price must be $0.");
            }
        }
        // Case 2: This is a PAID CYOP ticket (configured with a positive range)
        else {
            // Now, and only now, check if the price is within the paid range.
            if (price < cyopTicket.minPrice || price > cyopTicket.maxPrice) {
                return new Utils.CustomError("Price out of range.");
            }
        }

        if (price === 0) {
            let cart = await models.EventTicketCart.create({
                completed: false,
                eventId: event.id
            }).save();

            return {
                client_secret: '',
                cartId: cart.id
            }
        } // We don't need to create a payment intent for free events
        else if (!event.organizer.stripeAccountVerified) return new Utils.CustomError("Event not found."); // organizer not verified means no money being paid either

        return (await stripeHandler.createPaymentIntent(event.organizer.stripeConnectId, event.id, price * 100, user ? user.stripeCustomerId : undefined, event.type))
    }

    @Mutation(() => String)
    async updateCYOPClientSecret(@Arg('id') id: string, @Arg('eventId') eventId: string, @Arg('price') price: number) {
        const event = await models.Events.findOne({ where: { id: eventId }, relations: ['organizer'] });

        if (!event) return new Utils.CustomError("Event not found.");

        if (!event.visible || !event.organizer.stripeAccountVerified) return new Utils.CustomError("Event not found.");

        if (event.type !== models.EventType.CYOP) return new Utils.CustomError("Wrong type of Event.");

        let cyopTicket = await models.EventTickets.findOne({ where: { id: event.cyop_id } });

        if (!cyopTicket) return new Utils.CustomError("Event not found.");

        if (price < cyopTicket.minPrice || price > cyopTicket.maxPrice) return new Utils.CustomError("Price out of range.");

        const intent = await stripeHandler.updatePaymentIntent(id, price * 100, event.organizer.stripeConnectId, event.type);

        return intent.status;
    }

    @Mutation(() => String)
    async registerFreeEventTickets(@Arg('args') args: models.RegisterFreeEventInput) {

        let event = await models.Events.findOne({ where: { id: args.eventId }, relations: ['organizer', "prices"] });

        if (!event) return new Utils.CustomError("Event not found");

        let cart = await models.EventTicketCart.findOne({ where: { id: args.cartId }, relations: ['tickets'] });

        if (!cart) {
            cart = await models.EventTicketCart.create({
                completed: false,
                eventId: event.id
            }).save()
        };

        if (cart.completed) return new Utils.CustomError("Cart already completed");

        let user: models.Users | null = null;
        try {
            user = await Utils.getUserFromJsWebToken(args.userToken || "");
        } catch { user = null }

        for (let i = 0; i < args.tickets.length; i++) {
            let ticket = args.tickets[i];

            let eventTicket = await models.EventTickets.findOne({ where: { priceId: ticket.id } });

            if (!eventTicket) return new Utils.CustomError("Ticket not found");

            if (eventTicket.amount !== 0) return new Utils.CustomError("Ticket not free");

            let ticketBuy = models.EventTicketBuys.create({
                type: user ? 'user' : "guest",
                name: args.name,
                email: args.email,
                quantity: ticket.quantity,
                user: user ? { id: user.id } : null,
                eventTicket,
                cart
            });

            await ticketBuy.save(); // Ensure ticket buy is saved

            if (!cart.tickets) cart.tickets = [];
            cart.tickets.push(ticketBuy);
        }

        user ? cart.user = user : null;
        cart.type = user ? 'user' : 'guest';
        cart.name = args.name;
        cart.email = args.email;
        cart.completed = true;
        cart.dateCompleted = new Date();

        await cart.save();

        if (args.email) Utils.Mailer.sendTicketBuyConfirmation({ name: args.name, eventName: event.title, ticketLink: `${Utils.getCravingsWebUrl()}/events/${event.id}/ticket?cart_id=${cart.id}`, qrCode: cart.qrCode, email: args.email });

        return "Registered For Event Successfully"
    }

    @Mutation(() => [models.EventRegistrationListResponse])
    async addToEventRegistration(@Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('registrationList', () => [ models.EventRegistrationListInput ] ) registrationList: models.EventRegistrationListInput[] ) {
        let organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to create discount code.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } } });
        if (!event) throw new Utils.CustomError("Event not found");

        if ( 
            !(
                event.type === models.EventType.REGISTRATION || !event.is_public
            )
        ) throw new Utils.CustomError("Event is not a registration or private event.");

        let newRegs: models.EventRegistrationListResponse[] = [];

        for ( let i = 0; i < registrationList.length; i++ ) {
            let reg = registrationList[i];

            let existingReg = await models.EventRegistrationList.findOne({ where: { email: reg.email, name: reg.name, phoneNumber: reg.phoneNumber, event: { id: event.id } } });
            if ( existingReg ) continue; // Don't add duplicates

            let newReg = await models.EventRegistrationList.create({
                name: reg.name,
                email: reg.email,
                phoneNumber: reg.phoneNumber,
                status: models.RegistrationStatus.NOT_SENT,
                registrationDate: new Date(),
                event
            }).save();

            newRegs.push({ id: newReg.id, name: newReg.name, email: newReg.email, phoneNumber: newReg.phoneNumber, status: models.RegistrationStatus.NOT_SENT });
        }

        return newRegs;
    }

    @Mutation( () => String )
    async removeFromEventRegistration( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('registrationId') registrationId: string ) {
        let organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to create discount code.

        if (!organizer) throw new Utils.CustomError("Invalid token");

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } } });

        if (!event) throw new Utils.CustomError("Event not found");

        if (
            !(
                event.type === models.EventType.REGISTRATION || !event.is_public
            )
        ) throw new Utils.CustomError("Event is not a registration or private event.");

        let reg = await models.EventRegistrationList.findOne({ where: { id: registrationId, event: { id: event.id } }, relations: ['event', 'event.organizer'] });

        if ( !reg ) throw new Utils.CustomError("Registration not found");

        await reg.remove();

        return "Registration removed successfully";
    }

    @Mutation( () => String )
    async sendRegistrationInviteEmail( @Arg('token') token: string, @Arg('eventId') eventId: string, @Arg('registrationIds') registrationIds: string[], @Arg('customMessage', { nullable: true }) customMessage?: string ) {
        let organizer = await Utils.getOrgFromOrgOrMemberJsWebToken(token, [], true); // Needs to be an admin to create discount code.
        if (!organizer) throw new Utils.CustomError("Invalid token");

        let event = await models.Events.findOne({ where: { id: eventId, organizer: { id: organizer.id } } });
        if (!event) throw new Utils.CustomError("Event not found");

        if (
            !(
                event.type === models.EventType.REGISTRATION || !event.is_public
            )
        ) throw new Utils.CustomError("Event is not a registration or private event.");

        for ( let registrationId of registrationIds ) {
            let reg = await models.EventRegistrationList.findOne({ where: { id: registrationId, event: { id: event.id } }, relations: ['event', 'event.organizer'] });

            if ( !reg ) throw new Utils.CustomError("Registration not found");

            if ( reg.status === models.RegistrationStatus.ACCEPTED ) throw new Utils.CustomError(`Registration already accepted: ${reg.name} - ${reg.email}`);
            if ( reg.status === models.RegistrationStatus.CANCELLED ) throw new Utils.CustomError(`Registration cancelled: ${reg.name} - ${reg.email}`);

            let link_to_open = `${Utils.getCravingsWebUrl()}/events/${event.id}/register?reg_id=${reg.id}`;

            Utils.Mailer.sendEventRegistrationInviteEmail({ name: reg.name, eventName: event.title, orgName: organizer.orgName, link_to_open, customMessage, email: reg.email });
            reg.status = models.RegistrationStatus.WAITING;
            await reg.save();
        }

        return "Registration invite sent successfully";
    }
}
