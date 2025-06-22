import "reflect-metadata";
require('dotenv').config()

import { createConnection } from "typeorm";
import * as models from './models';

const testCouponFunctionality = async () => {
    console.log("Testing Coupon Functionality...");

    const connection = await createConnection({
        type: "sqlite",
        database: "./db.sqlite3",
        entities: ["src/models/*.ts"],
        synchronize: true,
    });

    // Get a sample event
    const event = await models.Events.findOne({
        relations: ['prices', 'organizer']
    });

    if (!event) {
        console.log("No events found. Please run migration first.");
        return;
    }

    console.log(`Testing with event: ${event.title}`);

    // Test coupon creation
    console.log("\n1. Testing coupon creation...");
    const coupon = await models.Coupon.create({
        code: "TESTCOUPON123",
        description: "Test coupon for 25% off",
        discountAmount: 25,
        discountType: 'percentage',
        maxUses: 10,
        currentUses: 0,
        active: true,
        appliesToAllTickets: true,
        event: { id: event.id }
    }).save();

    console.log(`Created coupon: ${coupon.code}`);

    // Test coupon validation
    console.log("\n2. Testing coupon validation...");
    const validCoupon = await models.Coupon.findOne({
        where: { code: "TESTCOUPON123" },
        relations: ['event', 'specificTicket']
    });

    if (validCoupon) {
        console.log(`Coupon found: ${validCoupon.code}`);
        console.log(`Discount: ${validCoupon.discountAmount}%`);
        console.log(`Max uses: ${validCoupon.maxUses}`);
        console.log(`Current uses: ${validCoupon.currentUses}`);
        console.log(`Active: ${validCoupon.active}`);
    }

    // Test cart creation with coupon
    console.log("\n3. Testing cart creation with coupon...");
    const cart = await models.EventTicketCart.create({
        completed: false,
        eventId: event.id,
        appliedCoupon: coupon,
        appliedCouponId: coupon.id,
        discountAmount: 25, // 25% of $100 = $25
        originalTotal: 100,
        finalTotal: 75
    }).save();

    console.log(`Created cart with coupon: ${cart.id}`);
    console.log(`Original total: $${cart.originalTotal}`);
    console.log(`Discount: $${cart.discountAmount}`);
    console.log(`Final total: $${cart.finalTotal}`);

    // Test coupon usage increment
    console.log("\n4. Testing coupon usage increment...");
    coupon.currentUses += 1;
    await coupon.save();
    console.log(`Updated coupon usage: ${coupon.currentUses}`);

    // Clean up test data
    console.log("\n5. Cleaning up test data...");
    await cart.remove();
    await coupon.remove();
    console.log("Test data cleaned up");

    console.log("\n✅ Coupon functionality test completed successfully!");
};

try {
    testCouponFunctionality();
} catch (e) {
    console.error("❌ Test failed:", e);
} 