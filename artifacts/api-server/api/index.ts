// Vercel Serverless entry point.
// Exports the Express app as the default handler — no app.listen() call.
// Local development uses src/index.ts which calls app.listen() with PORT.
import app from "../src/app";

export default app;
