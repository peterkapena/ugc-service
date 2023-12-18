import "reflect-metadata";
import "./initialize/index.js";
import { buildSchema } from "type-graphql";
import { resolvers } from "./resolvers/index.js";
import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import Context from "./models/context.js";
import UserClass from "./models/user.js";
import { authChecker } from "./services/authchecker.js";
import jwt from "./utils/jwt.js";

const schema = await buildSchema({
  resolvers,
  validate: false,
  authChecker,
});

const server = new ApolloServer({
  schema,
  formatError: (formattedError, error) => {
    // unwrapResolverError removes the outer GraphQLError wrapping from
    // errors thrown in resolvers, enabling us to check the instance of
    // the original error

    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      return formattedError;
    }

    console.error(error);

    if (unwrapResolverError(error)) {
      return { message: "Internal server error" };
    }
    return formattedError;
  },
  plugins: [
    process.env.NODE_ENV === "production" && !process.env.IS_TEST
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageLocalDefault(),
  ],
});

const app = express();
// const httpServer = http.createServer(app);

const main = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  app.use("/spa", express.static(join(__dirname, "../../spa")));
  await server.start();

  app.use(
    "/",
    cors({
      origin: process.env.ORIGINS.split(";"),
    }),
    bodyParser.json(),

    expressMiddleware(server, {
      context: async (ctx: Context) => {
        const token = ctx.req.headers.authorization || "";
        if (token) {
          try {
            const user = jwt.decodeJwt<UserClass>(token);
            ctx.user = user;
          } catch (error) {
            console.error(error);
          }
        }
        return ctx;
      },
    })
  );
  

  const port = +process.env.APP_PORT;
  app.listen({ port });
  // await new Promise((resolve) => app.listen({ port }, () => resolve(null)));
  console.log(`🚀 Server ready at http://localhost:${port}/`);
};

main().catch((err) => console.log(err));
// import crypto from "./services/crypto.js";

// const aa=crypto.encrypt("hello")
// console.log(aa)

// console.log(crypto.decrypt(aa))
