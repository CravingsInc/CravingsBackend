import express from 'express';
import CartRouter from './cart';
import UserRouter from './user';
import EventRouter from './event';
import StripeRouter from './stripe';

const ApiRouter = express.Router();

// API Routes
ApiRouter.use( '/cart', CartRouter);

export default {
    ApiRouter,
    UserRouter,
    EventRouter,
    StripeRouter
};
