import * as models from '../../models';
import { CreateOrganizerEventResponse } from '../types';

export const createSampleCoupons = async (orgsEvents: CreateOrganizerEventResponse) => {
    console.log(`\nCreating sample coupons for events`);

    for (const orgId in orgsEvents) {
        const eventIds = orgsEvents[orgId];

        for (const eventId of eventIds) {
            console.log(`\n\tCreating coupons for event: ${eventId}`);

            const event = await models.Events.findOne({
                where: { id: eventId },
                relations: ['prices']
            });

            if (!event || event.prices.length === 0) continue;

            // Create a percentage discount coupon for all tickets
            await models.Coupon.create({
                code: `SAVE20${eventId.slice(0, 4).toUpperCase()}`,
                description: "20% off all tickets",
                discountAmount: 20,
                discountType: 'percentage',
                maxUses: 50,
                currentUses: 0,
                active: true,
                appliesToAllTickets: true,
                event: { id: eventId }
            }).save();

            // Create a fixed amount discount coupon for specific ticket
            if (event.prices.length > 0) {
                await models.Coupon.create({
                    code: `FIXED10${eventId.slice(0, 4).toUpperCase()}`,
                    description: "$10 off VIP tickets",
                    discountAmount: 10,
                    discountType: 'fixed',
                    maxUses: 25,
                    currentUses: 0,
                    active: true,
                    appliesToAllTickets: false,
                    specificTicket: { id: event.prices[0].id },
                    event: { id: eventId }
                }).save();
            }

            // Create an expired coupon for testing
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

            await models.Coupon.create({
                code: `EXPIRED${eventId.slice(0, 4).toUpperCase()}`,
                description: "Expired coupon for testing",
                discountAmount: 15,
                discountType: 'percentage',
                maxUses: 10,
                currentUses: 0,
                active: true,
                validUntil: expiredDate,
                appliesToAllTickets: true,
                event: { id: eventId }
            }).save();

            console.log(`\t\tCreated 3 sample coupons for event: ${eventId}`);
        }
    }

    console.log(`\nSample coupons created successfully`);
}; 