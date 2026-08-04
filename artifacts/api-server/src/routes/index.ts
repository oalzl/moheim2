import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bidsRouter from "./bids";
import favoritesRouter from "./favorites";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bids", bidsRouter);
router.use("/favorites", favoritesRouter);

export default router;
