import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger";
import router from "./routes";

const app = express();

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/healthz" },
  }),
);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api", router);

export default app;
