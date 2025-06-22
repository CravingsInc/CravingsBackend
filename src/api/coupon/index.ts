import express from "express";
import * as models from '../../models';
import { Utils } from '../../utils';

const router = express.Router();

// Add CORS headers for coupon routes
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Generate unique coupon code
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

// GET /api/coupon/generate - Generate a new coupon code
router.get('/generate', async (req, res) => {
    try {
        // Get the authorization token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token required'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify organizer token
        try {
            await Utils.getOrganizerFromJsWebToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Generate unique coupon code
        const couponCode = await generateUniqueCouponCode();

        res.json({
            success: true,
            couponCode: couponCode,
            message: 'Coupon code generated successfully'
        });

    } catch (error) {
        console.error('Error generating coupon code:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/coupon/validate/:code - Validate a coupon code
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { eventId, ticketId } = req.query;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: 'Event ID is required'
            });
        }

        const coupon = await models.Coupon.findOne({
            where: { code: code.toUpperCase() },
            relations: ['event', 'specificTicket']
        });

        if (!coupon) {
            return res.json({
                success: true,
                valid: false,
                message: "Invalid coupon code"
            });
        }

        if (!coupon.active) {
            return res.json({
                success: true,
                valid: false,
                message: "Coupon is inactive"
            });
        }

        if (coupon.event.id !== eventId) {
            return res.json({
                success: true,
                valid: false,
                message: "Coupon is not valid for this event"
            });
        }

        if (coupon.currentUses >= coupon.maxUses) {
            return res.json({
                success: true,
                valid: false,
                message: "Coupon usage limit exceeded"
            });
        }

        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return res.json({
                success: true,
                valid: false,
                message: "Coupon is not yet valid"
            });
        }

        if (coupon.validUntil && now > coupon.validUntil) {
            return res.json({
                success: true,
                valid: false,
                message: "Coupon has expired"
            });
        }

        if (!coupon.appliesToAllTickets && ticketId) {
            if (coupon.specificTicket?.id !== ticketId) {
                return res.json({
                    success: true,
                    valid: false,
                    message: "Coupon is not valid for this ticket type"
                });
            }
        }

        res.json({
            success: true,
            valid: true,
            discountAmount: coupon.discountAmount,
            discountType: coupon.discountType,
            couponId: coupon.id,
            message: "Coupon is valid"
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router; 