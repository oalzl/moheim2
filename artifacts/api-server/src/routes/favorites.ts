import { Router } from "express";
import { db } from "@workspace/db";
import { favoritesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/favorites
router.get("/", async (_req, res) => {
  try {
    const favs = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.is_favorite, true))
      .orderBy(favoritesTable.created_at);

    res.json(favs);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[favorites] list error");
    res.status(500).json({ error: msg });
  }
});

// POST /api/favorites/:bidNtceNo
router.post("/:bidNtceNo", async (req, res) => {
  try {
    const { bidNtceNo } = req.params;
    await db
      .insert(favoritesTable)
      .values({ bid_ntce_no: bidNtceNo, is_favorite: true })
      .onConflictDoUpdate({
        target: favoritesTable.bid_ntce_no,
        set: { is_favorite: true },
      });

    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[favorites] add error");
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/favorites/:bidNtceNo
router.delete("/:bidNtceNo", async (req, res) => {
  try {
    const { bidNtceNo } = req.params;
    await db
      .delete(favoritesTable)
      .where(eq(favoritesTable.bid_ntce_no, bidNtceNo));

    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, "[favorites] remove error");
    res.status(500).json({ error: msg });
  }
});

export default router;
