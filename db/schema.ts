import { sqliteTable, text, integer, check, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const catalogMeta = sqliteTable("catalog_meta", {id:text("id").primaryKey(),revision:integer("revision").notNull().default(0),lastMutation:text("last_mutation").notNull()});
export const cards = sqliteTable("cards", {id:text("id").primaryKey(),code:text("code").notNull().unique(),data:text("data").notNull()});
export const albums = sqliteTable("albums", {id:text("id").primaryKey(),data:text("data").notNull()});
export const admins = sqliteTable("admins", {slot:text("slot").primaryKey(),email:text("email").notNull().unique(),userId:text("user_id").unique(),name:text("name").notNull(),updatedAt:text("updated_at").notNull()},t=>[check("admin_slot",sql`${t.slot} IN ('owner', 'editor')`)]);
export const audit = sqliteTable("audit", {id:text("id").primaryKey(),at:text("at").notNull(),actorId:text("actor_id").notNull(),actorName:text("actor_name").notNull(),action:text("action").notNull(),entity:text("entity").notNull(),before:text("before_json"),after:text("after_json"),revision:integer("revision").notNull()},t=>[index("audit_revision").on(t.revision)]);

export const settings=sqliteTable("settings",{id:text("id").primaryKey(),data:text("data").notNull()});
