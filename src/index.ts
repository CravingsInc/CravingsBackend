import "reflect-metadata";
require('dotenv').config()
import express from "express";
import http from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import path from "path";
import { createConnection } from "typeorm";
import { TestResolver, UserResolver, FoodTruckResolver } from "./resolvers";

import { IoServer } from "./io";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const httpServer = http.createServer(app);

async function main() {
  await createConnection(
    process.env.CLEARDB_DATABASE_NEW_URL
      ? {
          type: "mysql",
          url: process.env.CLEARDB_DATABASE_NEW_URL,
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
    resolvers: [TestResolver, UserResolver, FoodTruckResolver],
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
      { port: process.env.PORT || 3555, host: "0.0.0.0" },
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
