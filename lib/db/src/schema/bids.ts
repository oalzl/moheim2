import {
  pgTable,
  text,
  uuid,
  doublePrecision,
  real,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const bidsTable = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bid_ntce_no: text("bid_ntce_no").notNull(),
    bid_ntce_ord: text("bid_ntce_ord").notNull().default("1"),
    bid_ntce_nm: text("bid_ntce_nm"),
    cnstwk_nm: text("cnstwk_nm"),
    ntce_instt_nm: text("ntce_instt_nm"),
    dminstt_nm: text("dminstt_nm"),
    cnstwk_se: text("cnstwk_se"),
    cnstwk_type_of_bsns: text("cnstwk_type_of_bsns"),
    license_req: text("license_req"),
    region_rstrn: text("region_rstrn"),
    asgn_bdgt_amt: doublePrecision("asgn_bdgt_amt"),
    presmpt_prce: doublePrecision("presmpt_prce"),
    ntce_dt: timestamp("ntce_dt", { withTimezone: true }),
    bid_clse_dt: timestamp("bid_clse_dt", { withTimezone: true }),
    openg_dt: timestamp("openg_dt", { withTimezone: true }),
    cnstwk_period: text("cnstwk_period"),
    prtcpt_req: text("prtcpt_req"),
    relevance_score: real("relevance_score").default(0),
    raw_data: jsonb("raw_data"),
    collected_at: timestamp("collected_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_bids_ntce_no_ord").on(table.bid_ntce_no, table.bid_ntce_ord),
    index("idx_bids_clse_dt").on(table.bid_clse_dt),
    index("idx_bids_ntce_dt").on(table.ntce_dt),
  ],
);

export type Bid = typeof bidsTable.$inferSelect;
export type InsertBid = typeof bidsTable.$inferInsert;
