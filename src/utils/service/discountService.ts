// services/discountService.ts
import { EventDiscountsCodes } from "../../models";

export type DiscountResult = {
    discounts: {
        discount: EventDiscountsCodes;
        amount: number;
        itemBreakdown: Array<{
            ticketId: string;
            discountAmount: number;
        }>;
    }[];
    totalDiscount: number;
    itemDiscounts: {
        ticketId: string;
        discountAmount: number;
    }[];
    subtotal: number;
    finalAmount: number;
    appliedCodes: string[];
};

export class DiscountService {
    static async validateAndApplyDiscounts(
        couponCodes: string[],
        eventId: string,
        cartItems: Array<{ ticketId: string; quantity: number; unitPrice: number }>
    ) {
        const discounts: EventDiscountsCodes[] = [];
        const invalidCodes: string[] = [];

        // Validate all coupon codes first
        for (const code of couponCodes) {
            const discount = await EventDiscountsCodes.findOne({
                where: { code: code.trim(), event: { id: eventId } },
                relations: ['rules', 'rules.applicableTickets', 'rules.applicableTickets.ticket']
            });

            if (!discount || !discount.isValid()) {
                invalidCodes.push(code);
                continue;
            }

            // Check if discount applies to any item in cart
            const cartItemIds = cartItems.map(item => item.ticketId);
            const isApplicable = discount.isApplicableToCart(
                cartItems.map(item => ({ ticketId: item.ticketId, price: item.unitPrice }))
            );

            if (!isApplicable) {
                invalidCodes.push(code);
                continue;
            }

            discounts.push(discount);
        }

        if (invalidCodes.length > 0) {
            throw new Error(`Invalid or inapplicable coupon codes: ${invalidCodes.join(', ')}`);
        }

        // Apply discounts in sequence (you might want to define an order)
        let totalDiscount = 0;
        const itemDiscounts: Map<string, number> = new Map(); // ticketId -> total discount amount
        const appliedDiscounts: Array<{
            discount: EventDiscountsCodes;
            amount: number;
            itemBreakdown: Array<{ ticketId: string; discountAmount: number }>;
        }> = [];

        // Initialize item discounts map
        cartItems.forEach(item => {
            itemDiscounts.set(item.ticketId, 0);
        });

        // Apply each discount
        for (const discount of discounts) {
            let discountTotal = 0;
            const discountBreakdown: Array<{ ticketId: string; discountAmount: number }> = [];

            for (const item of cartItems) {
                const currentItemTotal = item.unitPrice * item.quantity;
                const currentDiscount = itemDiscounts.get(item.ticketId) || 0;
                const remainingValue = currentItemTotal - currentDiscount;

                if (remainingValue > 0) {
                    const discountAmount = discount.calculateDiscountForTicket(item.unitPrice, item.ticketId);
                    const applicableDiscount = Math.min(remainingValue, discountAmount * item.quantity);
                    
                    if (applicableDiscount > 0) {
                        discountTotal += applicableDiscount;
                        itemDiscounts.set(item.ticketId, currentDiscount + applicableDiscount);
                        discountBreakdown.push({
                            ticketId: item.ticketId,
                            discountAmount: applicableDiscount / item.quantity // per unit
                        });
                    }
                }
            }

            if (discountTotal > 0) {
                totalDiscount += discountTotal;
                appliedDiscounts.push({
                    discount,
                    amount: discountTotal,
                    itemBreakdown: discountBreakdown
                });
            }
        }

        const subtotal = cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
        const finalAmount = Math.max(0, subtotal - totalDiscount);

        return {
            discounts: appliedDiscounts,
            totalDiscount,
            itemDiscounts: Array.from(itemDiscounts.entries()).map(([ticketId, amount]) => ({
                ticketId,
                discountAmount: amount
            })),
            subtotal,
            finalAmount,
            appliedCodes: appliedDiscounts.map(ad => ad.discount.code)
        };
    }

    // Helper to check compatibility between discounts
    static areDiscountsCompatible(discounts: EventDiscountsCodes[]): boolean {
        // Implement your business rules here
        // For example: no two percentage discounts, or specific combinations
        return true; // Default: all discounts are compatible
    }
}
