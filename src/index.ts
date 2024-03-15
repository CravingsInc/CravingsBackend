import "reflect-metadata";
require('dotenv').config()
import express from "express";
import http from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import path from "path";
import { createConnection } from "typeorm";
import * as resolvers from "./resolvers";
import * as models from "./models";

const multer = require("multer");
const bodyParser = require("body-parser");

import { IoServer } from "./io";
import { Utils, s3, stripeHandler } from "./utils";
import { stripe } from "./utils/stripe";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook" || req.originalUrl === "/stripe/webhook/connect") next();

  else bodyParser.json()(req, res, next);
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post('event/upload/banner', ( req: any, res: any ) => {
  const upload = multer().single("banner");

  upload( req, res, async function ( err: any ) {
    if ( req.fileValidationError ) return res.send(req.fileValidationError);

    else if ( !req.file ) return res.json({ error: "Please select an image to upload" });

    else if ( err ) return res.send(err);

    try {
      let organizer: models.Organizers;
      let event: models.Events | null;

      organizer = await Utils.getOrganizerFromJsWebToken(req.body.token);
      event = await models.Events.findOne({ where: { id: req.body.eventId, organizer: { id: organizer.id } } });

      if ( !event ) return res.json({ error: "Event not found" });

      let url = await s3.uploadImage(req.file, req.file.mimetype, "events");
      event.banner = url;
      await event.save();

      return res.json({ response: url });
    }catch( err ) {
      res.json({ error: "Problem changing event banner" });
    }
  
  })
})

app.post("user/upload/image", (req: any, res: any) => {
  const upload = multer().single("image");
  upload(req, res, async function (err: any) {
    if (req.fileValidationError) return res.send(req.fileValidationError);

    else if (!req.file) return res.json({ error: "Please select an image to upload" });

    else if (err instanceof multer.MulterError) return res.send(err);

    else if (err) return res.send(err);

    try {
      let user: models.Users | models.Organizers | undefined = undefined;
      try {
        user = (await Utils.getUserFromJsWebToken(req.body.token));
      } catch {
        user = (await Utils.getUserFromJsWebToken(req.body.token));
      }

      let url = await s3.uploadImage(req.file, req.file.mimetype);
      user.profilePicture = url;
      await user.save();
      return res.json({ url });

    } catch (e) {
      console.log(e)
      res.json({
        error: "User does not exist can not upload profile image"
      });
    }
  })
});

app.post('/api/cart/QrCode', async ( req: any, res: any ) => {
  const upload = multer().single("image");

  upload( req, res, async function( err: any ) {
    if ( req.fileValidationError ) return res.send( req.fileValidationError );

    else if (!req.file) return res.json({ error: "Please select an image to upload" });

    else if (err instanceof multer.MulterError) return res.send(err);

    else if (err) return res.send(err);

    try {
      const cart = await models.EventTicketCart.findOne({ where: { stripeTransactionId: req.body.payment_intent } });

      if ( !cart ) return res.status(500).json({ error: 'Could not find Cart', param: req.body });

      if ( cart.qrCode.length === 0 && !cart.completed ) {
        let url = await s3.uploadImage(req.file, req.file.mimetype, 'qrCode')

        cart.qrCode = url;
        await cart.save();
      }

      return res.status(200).json({ message: 'success' });
    }catch(e) {
      console.log(e);

      res.status(500).json({ error: 'Error uploading qrCode' });
    }

  })
})

app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeHandler.constructWebHookEvent( req.body, sig as string );
  } catch ( err : any ) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      // PaymentIntent succeeded, handle accordingly
      const paymentIntent = event.data.object as any;

      if ( !paymentIntent.metadata ) return res.json({ received: true });;

      if ( paymentIntent.metadata.type === stripeHandler.PAYMENT_INTENT_TYPE.TICKET ) {
        if ( paymentIntent.metadata.eventId  && paymentIntent.metadata.priceList && paymentIntent.metadata.cart ) {
          let name, email = "";

          try {
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);

            let billingDetails = charge.billing_details;

            name = billingDetails.name || "";
            email = billingDetails.email || "";
          }catch(e) {
            console.log(e);
            return res.status(500).send('Problem getting charge information');
          }

          let response = await stripeHandler.StripeWebHooks.buyTicketSuccedded( paymentIntent.id, paymentIntent.metadata, name, email );

          return res.status( response.status ).send( response.message );
        }
        else return res.status(500).send('Required metadata not given');
      }

      break;
    case 'payment_intent.payment_failed':
      // PaymentIntent failed, handle accordingly
      console.log( event );
      break;
    // Handle other event types as needed
  }

  res.json({ received: true });
});

app.post('/stripe/webhook/connect', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeHandler.constructWebHookConnectEvent( req.body, sig as string );
  } catch ( err : any ) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  switch (event.type) {
    case 'account.updated':
      // PaymentIntent succeeded, handle accordingly
      const connectedAccount = event.data.object as any;

      console.log( connectedAccount );

      if ( !connectedAccount.metadata ) return res.json({ received: true });

      if ( connectedAccount.metadata.type && connectedAccount.metadata.userId ) {
        let response = await stripeHandler.StripeWebHooks.updateConnectAccount( connectedAccount.id, connectedAccount.metadata.userId, connectedAccount.metadata.type );
        
        return res.status( response.status ).send( response.message );
      }

      break;
    // Handle other event types as needed
  }

  res.json({ received: true });
});

const httpServer = http.createServer(app);

async function main() {
  await createConnection(
    Utils.AppConfig.BasicConfig.CLEARDB_DATABASE_NEW_URL
      ? {
          type: "mysql",
          url: Utils.AppConfig.BasicConfig.CLEARDB_DATABASE_NEW_URL,
          entities: ["src/models/*.ts"],
          synchronize: true,
        }
      : {
          type: "sqlite",
          database: "./db.sqlite3",
          entities: ["src/models/*.ts"],
          synchronize: true,
        }
  );

  const schema = await buildSchema({
    resolvers: [ ...( Object.values(resolvers) ) ] as [any],
    //dateScalarMode: "timestamp",
  });

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: (request: any) => {
      return { req: request.req, res: request.res };
    },
  });

  await server.start();
  server.applyMiddleware({ app });
  IoServer.attach(httpServer, {
    cors: {
      origin: "*"
    }
  });

  await new Promise<void>((resolve) =>
    httpServer.listen(
      { port: Utils.AppConfig.BasicConfig.PORT, host: "0.0.0.0" },
      resolve
    )
  );

  console.log(`🚀 Server ready at http://localhost:3555${server.graphqlPath}`);
}

try {
  main();
} catch (e) {
  console.error(e);
}
