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

import Api from './api';
const bodyParser = require("body-parser");

import { IoServer } from "./io";
import { Utils } from "./utils";

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

app.use( '/event', Api.EventRouter );

app.use('/user', Api.UserRouter );

app.use("/api", Api.ApiRouter)

app.use('/stripe', Api.StripeRouter );

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
