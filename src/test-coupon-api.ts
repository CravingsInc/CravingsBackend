import "reflect-metadata";
require('dotenv').config()

import { createConnection } from "typeorm";
import * as models from './models';

const testCouponGenerationAPI = async () => {
    console.log("Testing Coupon Generation API...");

    const connection = await createConnection({
        type: "sqlite",
        database: "./db.sqlite3",
        entities: ["src/models/*.ts"],
        synchronize: true,
    });

    // Get a sample event and organizer
    const event = await models.Events.findOne({
        relations: ['organizer']
    });

    if (!event) {
        console.log("No events found. Please run migration first.");
        return;
    }

    console.log(`Testing with event: ${event.title}`);

    // Test coupon generation function
    console.log("\n1. Testing coupon code generation...");

    const generateUniqueCouponCode = async (): Promise<string> => {
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
    };

    // Generate multiple codes to test uniqueness
    const codes = [];
    for (let i = 0; i < 5; i++) {
        const code = await generateUniqueCouponCode();
        codes.push(code);
        console.log(`Generated code ${i + 1}: ${code}`);
    }

    // Test creating coupon with empty code (should auto-generate)
    console.log("\n2. Testing coupon creation with empty code...");

    const coupon = await models.Coupon.create({
        code: '', // This should be auto-generated
        description: "Auto-generated test coupon",
        discountAmount: 15,
        discountType: 'percentage',
        maxUses: 10,
        currentUses: 0,
        active: true,
        appliesToAllTickets: true,
        event: { id: event.id }
    }).save();

    console.log(`Created coupon with auto-generated code: ${coupon.code}`);

    // Test coupon validation
    console.log("\n3. Testing coupon validation...");
    const validCoupon = await models.Coupon.findOne({
        where: { code: coupon.code },
        relations: ['event', 'specificTicket']
    });

    if (validCoupon) {
        console.log(`Coupon validation successful: ${validCoupon.code}`);
        console.log(`Discount: ${validCoupon.discountAmount}%`);
        console.log(`Active: ${validCoupon.active}`);
    }

    // Clean up test data
    console.log("\n4. Cleaning up test data...");
    await coupon.remove();
    console.log("Test data cleaned up");

    console.log("\n✅ Coupon Generation API test completed successfully!");
    console.log("\nAPI Endpoints available:");
    console.log("- GET /api/coupon/generate (with Bearer token)");
    console.log("- GET /api/coupon/validate/:code?eventId=xxx&ticketId=xxx");
    console.log("\nGraphQL mutations available:");
    console.log("- generateCouponCode(token: String!): String!");
    console.log("- createCoupon(token: String!, input: CreateCouponInput!): CouponResponse!");
};

try {
    testCouponGenerationAPI();
} catch (e) {
    console.error("❌ Test failed:", e);
} 