import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default("customer"), // customer, delivery_agent
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameUz: text("name_uz").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  nameUz: text("name_uz").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  descriptionUz: text("description_uz"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("dona"), // dona, kg, litr
  image: text("image"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  street: text("street").notNull(),
  city: text("city").notNull().default("Toshkent"),
  district: text("district"),
  zipCode: text("zip_code"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").notNull().default(false),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  addressId: integer("address_id").references(() => addresses.id),
  status: text("status").notNull().default("pending"), // pending, accepted, packed, on_the_way, delivered, cancelled
  paymentMethod: text("payment_method").notNull(), // cash, telegram_pay, payme, click
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("5000"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const deliveryAssignments = pgTable("delivery_assignments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  deliveryAgentId: integer("delivery_agent_id").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  earnings: decimal("earnings", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("assigned"), // assigned, accepted, picked_up, delivered
});

export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertDeliveryAssignmentSchema = createInsertSchema(deliveryAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type DeliveryAssignment = typeof deliveryAssignments.$inferSelect;
export type InsertDeliveryAssignment = z.infer<typeof insertDeliveryAssignmentSchema>;

export type CartItem = typeof cart.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartSchema>;
