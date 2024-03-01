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
import { Utils, s3 } from "./utils";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === "/stripe_webhook" || req.originalUrl === "/stripe/connect/webhook") next();

  else bodyParser.json()(req, res, next);
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
    dateScalarMode: "timestamp",
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
