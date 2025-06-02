import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Documents table schema
 * Stores metadata about uploaded documents
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(), // UUID for public access
  fileName: text("file_name").notNull(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(), // Path to the file in storage
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for our schema
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
