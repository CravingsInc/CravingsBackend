import express from 'express';
import CartRouter from './cart';
import UserRouter from './user';
import EventRouter from './event';
import StripeRouter from './stripe';
import OrganizerRouter from './organizer';
import CouponRouter from './coupon';

const ApiRouter = express.Router();

// API Routes
ApiRouter.use('/cart', CartRouter);
ApiRouter.use('/coupon', CouponRouter);

export default {
    ApiRouter,
    UserRouter,
    EventRouter,
    StripeRouter,
    OrganizerRouter,
    CouponRouter
};
