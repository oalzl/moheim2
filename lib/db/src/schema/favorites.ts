import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  bid_ntce_no: text("bid_ntce_no").notNull().unique(),
  is_favorite: boolean("is_favorite").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Favorite = typeof favoritesTable.$inferSelect;
export type InsertFavorite = typeof favoritesTable.$inferInsert;
