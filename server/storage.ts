import { eq, and, desc } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });
import type { 
  User, InsertUser,
  Category, InsertCategory,
  Product, InsertProduct,
  Address, InsertAddress,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  DeliveryAssignment, InsertDeliveryAssignment,
  CartItem, InsertCartItem,
  Notification, InsertNotification,
  SpecialOffer, InsertSpecialOffer
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(categoryId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Addresses
  getUserAddresses(userId: number): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;

  // Cart
  getCartItems(userId: number): Promise<any[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(cartItemId: number, quantity: number): Promise<void>;
  removeFromCart(cartItemId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Orders
  getOrders(userId: number): Promise<any[]>;
  getActiveOrder(userId: number): Promise<any | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(orderId: number, status: string): Promise<void>;

  // Delivery
  getAssignedOrders(deliveryAgentId: number): Promise<any[]>;
  getDeliveryHistory(deliveryAgentId: number): Promise<any[]>;
  getDeliveryStats(deliveryAgentId: number): Promise<any>;
  createDeliveryAssignment(assignment: InsertDeliveryAssignment): Promise<DeliveryAssignment>;
  updateDeliveryStatus(orderId: number, status: string): Promise<void>;

  // Admin
  getAdminStats(): Promise<any>;
  getAllOrders(status?: string, limit?: number): Promise<any[]>;
  getAllUsers(role?: string, limit?: number): Promise<User[]>;
  updateProduct(productId: number, updates: Partial<Product>): Promise<void>;
  deleteProduct(productId: number): Promise<void>;
  updateCategory(categoryId: number, updates: Partial<Category>): Promise<void>;
  getDeliveryPerformance(): Promise<any>;

  // Notifications
  getNotifications(userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId?: number): Promise<void>;

  // Special Offers
  getActiveSpecialOffers(): Promise<SpecialOffer[]>;
  getSpecialOffers(): Promise<SpecialOffer[]>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(offerId: number, updates: Partial<SpecialOffer>): Promise<void>;
  deleteSpecialOffer(offerId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.telegramId, telegramId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories).where(eq(schema.categories.isActive, true));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(schema.categories).values(category).returning();
    return newCategory;
  }

  async getProducts(categoryId?: number): Promise<Product[]> {
    if (categoryId) {
      return await db.select().from(schema.products)
        .where(and(eq(schema.products.categoryId, categoryId), eq(schema.products.isAvailable, true)));
    }
    return await db.select().from(schema.products).where(eq(schema.products.isAvailable, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(schema.products).values(product).returning();
    return newProduct;
  }

  async getUserAddresses(userId: number): Promise<Address[]> {
    return await db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db.insert(schema.addresses).values(address).returning();
    return newAddress;
  }

  async getCartItems(userId: number): Promise<any[]> {
    return await db.select({
      id: schema.cart.id,
      quantity: schema.cart.quantity,
      productId: schema.cart.productId,
      product: {
        id: schema.products.id,
        nameUz: schema.products.nameUz,
        price: schema.products.price,
        unit: schema.products.unit,
        image: schema.products.image,
      }
    })
    .from(schema.cart)
    .innerJoin(schema.products, eq(schema.cart.productId, schema.products.id))
    .where(eq(schema.cart.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists
    const existing = await db.select().from(schema.cart)
      .where(and(
        eq(schema.cart.userId, cartItem.userId!), 
        eq(schema.cart.productId, cartItem.productId!)
      ));

    if (existing.length > 0) {
      // Update quantity
      const [updated] = await db.update(schema.cart)
        .set({ quantity: existing[0].quantity + cartItem.quantity })
        .where(eq(schema.cart.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new
      const [newCartItem] = await db.insert(schema.cart).values(cartItem).returning();
      return newCartItem;
    }
  }

  async updateCartItemQuantity(cartItemId: number, quantity: number): Promise<void> {
    await db.update(schema.cart)
      .set({ quantity })
      .where(eq(schema.cart.id, cartItemId));
  }

  async removeFromCart(cartItemId: number): Promise<void> {
    await db.delete(schema.cart).where(eq(schema.cart.id, cartItemId));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(schema.cart).where(eq(schema.cart.userId, userId));
  }

  async getOrders(userId: number): Promise<any[]> {
    return await db.select({
      id: schema.orders.id,
      status: schema.orders.status,
      paymentMethod: schema.orders.paymentMethod,
      paymentStatus: schema.orders.paymentStatus,
      subtotal: schema.orders.subtotal,
      deliveryFee: schema.orders.deliveryFee,
      total: schema.orders.total,
      estimatedDeliveryTime: schema.orders.estimatedDeliveryTime,
      createdAt: schema.orders.createdAt,
      address: {
        street: schema.addresses.street,
        city: schema.addresses.city,
        district: schema.addresses.district,
      }
    })
    .from(schema.orders)
    .innerJoin(schema.addresses, eq(schema.orders.addressId, schema.addresses.id))
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.createdAt));
  }

  async getActiveOrder(userId: number): Promise<any | undefined> {
    const activeStatuses = ['pending', 'accepted', 'packed', 'on_the_way'];
    
    const [order] = await db.select({
      id: schema.orders.id,
      status: schema.orders.status,
      paymentMethod: schema.orders.paymentMethod,
      paymentStatus: schema.orders.paymentStatus,
      subtotal: schema.orders.subtotal,
      deliveryFee: schema.orders.deliveryFee,
      total: schema.orders.total,
      estimatedDeliveryTime: schema.orders.estimatedDeliveryTime,
      createdAt: schema.orders.createdAt,
      address: {
        street: schema.addresses.street,
        city: schema.addresses.city,
        district: schema.addresses.district,
      }
    })
    .from(schema.orders)
    .innerJoin(schema.addresses, eq(schema.orders.addressId, schema.addresses.id))
    .where(and(
      eq(schema.orders.userId, userId),
      // @ts-ignore - Drizzle types issue with array includes
      schema.orders.status.in(activeStatuses)
    ))
    .orderBy(desc(schema.orders.createdAt));

    if (!order) return undefined;

    // Get order items
    const items = await db.select({
      id: schema.orderItems.id,
      quantity: schema.orderItems.quantity,
      pricePerUnit: schema.orderItems.pricePerUnit,
      total: schema.orderItems.total,
      product: {
        nameUz: schema.products.nameUz,
        image: schema.products.image,
      }
    })
    .from(schema.orderItems)
    .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .where(eq(schema.orderItems.orderId, order.id));

    // Get delivery assignment
    const [delivery] = await db.select({
      deliveryAgent: {
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        phoneNumber: schema.users.phoneNumber,
      },
      status: schema.deliveryAssignments.status,
    })
    .from(schema.deliveryAssignments)
    .innerJoin(schema.users, eq(schema.deliveryAssignments.deliveryAgentId, schema.users.id))
    .where(eq(schema.deliveryAssignments.orderId, order.id));

    return {
      ...order,
      items,
      deliveryAssignment: delivery,
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(schema.orders).values(order).returning();
    return newOrder;
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(schema.orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    await db.update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, orderId));
  }

  async getAssignedOrders(deliveryAgentId: number): Promise<any[]> {
    return await db.select({
      id: schema.orders.id,
      status: schema.orders.status,
      total: schema.orders.total,
      customerName: schema.users.firstName,
      customerPhone: schema.users.phoneNumber,
      address: {
        street: schema.addresses.street,
        city: schema.addresses.city,
        district: schema.addresses.district,
      },
      estimatedDeliveryTime: schema.orders.estimatedDeliveryTime,
      assignmentStatus: schema.deliveryAssignments.status,
      earnings: schema.deliveryAssignments.earnings,
    })
    .from(schema.deliveryAssignments)
    .innerJoin(schema.orders, eq(schema.deliveryAssignments.orderId, schema.orders.id))
    .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .innerJoin(schema.addresses, eq(schema.orders.addressId, schema.addresses.id))
    .where(and(
      eq(schema.deliveryAssignments.deliveryAgentId, deliveryAgentId),
      // @ts-ignore
      schema.deliveryAssignments.status.in(['assigned', 'accepted', 'picked_up'])
    ));
  }

  async getDeliveryHistory(deliveryAgentId: number): Promise<any[]> {
    return await db.select({
      id: schema.orders.id,
      customerName: schema.users.firstName,
      earnings: schema.deliveryAssignments.earnings,
      deliveredAt: schema.deliveryAssignments.deliveredAt,
    })
    .from(schema.deliveryAssignments)
    .innerJoin(schema.orders, eq(schema.deliveryAssignments.orderId, schema.orders.id))
    .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .where(and(
      eq(schema.deliveryAssignments.deliveryAgentId, deliveryAgentId),
      eq(schema.deliveryAssignments.status, 'delivered')
    ))
    .orderBy(desc(schema.deliveryAssignments.deliveredAt));
  }

  async getDeliveryStats(deliveryAgentId: number): Promise<any> {
    // This would be more complex in a real implementation with proper date filtering
    const history = await this.getDeliveryHistory(deliveryAgentId);
    
    const today = new Date();
    const todayDeliveries = history.filter(d => 
      d.deliveredAt && new Date(d.deliveredAt).toDateString() === today.toDateString()
    );
    
    const todayEarnings = todayDeliveries.reduce((sum, d) => sum + parseFloat(d.earnings || '0'), 0);
    const weekEarnings = history.slice(0, 7).reduce((sum, d) => sum + parseFloat(d.earnings || '0'), 0);
    const monthEarnings = history.reduce((sum, d) => sum + parseFloat(d.earnings || '0'), 0);

    return {
      todayDeliveries: todayDeliveries.length,
      todayEarnings: todayEarnings.toString(),
      weekEarnings: weekEarnings.toString(),
      monthEarnings: monthEarnings.toString(),
    };
  }

  async createDeliveryAssignment(assignment: InsertDeliveryAssignment): Promise<DeliveryAssignment> {
    const [newAssignment] = await db.insert(schema.deliveryAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateDeliveryStatus(orderId: number, status: string): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.earnings = '25000'; // Fixed delivery fee
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    } else if (status === 'picked_up') {
      updateData.pickedUpAt = new Date();
    }

    await db.update(schema.deliveryAssignments)
      .set(updateData)
      .where(eq(schema.deliveryAssignments.orderId, orderId));

    // Also update order status
    let orderStatus = status;
    if (status === 'picked_up') orderStatus = 'on_the_way';
    
    await this.updateOrderStatus(orderId, orderStatus);
  }

  // Admin methods
  async getAdminStats(): Promise<any> {
    // Get total counts
    const totalOrders = await db.select().from(schema.orders);
    const totalUsers = await db.select().from(schema.users);
    const totalProducts = await db.select().from(schema.products);
    const totalCategories = await db.select().from(schema.categories);

    // Get recent orders
    const recentOrders = await db.select().from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(10);

    // Calculate revenue
    const revenue = await db.select({
      total: schema.orders.total
    }).from(schema.orders).where(eq(schema.orders.paymentStatus, 'paid'));

    const totalRevenue = revenue.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);

    // Count active deliveries
    const activeDeliveries = await db.select().from(schema.orders)
      .where(
        // @ts-ignore - Drizzle types issue with .in() method
        schema.orders.status.in(['accepted', 'packed', 'on_the_way'])
      );

    return {
      totalOrders: totalOrders.length,
      totalUsers: totalUsers.length,
      totalProducts: totalProducts.length,
      totalCategories: totalCategories.length,
      totalRevenue: totalRevenue.toString(),
      recentOrders: recentOrders.length,
      activeDeliveries: activeDeliveries.length
    };
  }

  async getAllOrders(status?: string, limit: number = 50): Promise<any[]> {
    const baseQuery = db.select({
      id: schema.orders.id,
      status: schema.orders.status,
      paymentMethod: schema.orders.paymentMethod,
      paymentStatus: schema.orders.paymentStatus,
      total: schema.orders.total,
      createdAt: schema.orders.createdAt,
      customer: {
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        phoneNumber: schema.users.phoneNumber,
      },
      address: {
        street: schema.addresses.street,
        city: schema.addresses.city,
        district: schema.addresses.district,
      }
    })
    .from(schema.orders)
    .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .innerJoin(schema.addresses, eq(schema.orders.addressId, schema.addresses.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit);

    if (status) {
      return await baseQuery.where(eq(schema.orders.status, status));
    }

    return await baseQuery;
  }

  async getAllUsers(role?: string, limit: number = 100): Promise<User[]> {
    const baseQuery = db.select().from(schema.users).limit(limit);
    
    if (role) {
      return await baseQuery.where(eq(schema.users.role, role));
    }
    
    return await baseQuery;
  }

  async updateProduct(productId: number, updates: Partial<Product>): Promise<void> {
    await db.update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, productId));
  }

  async deleteProduct(productId: number): Promise<void> {
    await db.update(schema.products)
      .set({ isAvailable: false })
      .where(eq(schema.products.id, productId));
  }

  async updateCategory(categoryId: number, updates: Partial<Category>): Promise<void> {
    await db.update(schema.categories)
      .set(updates)
      .where(eq(schema.categories.id, categoryId));
  }

  async getDeliveryPerformance(): Promise<any> {
    const deliveryAgents = await db.select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
    }).from(schema.users).where(eq(schema.users.role, 'delivery_agent'));

    const performance = [];
    for (const agent of deliveryAgents) {
      const deliveries = await db.select().from(schema.deliveryAssignments)
        .where(and(
          eq(schema.deliveryAssignments.deliveryAgentId, agent.id),
          eq(schema.deliveryAssignments.status, 'delivered')
        ));

      const totalEarnings = deliveries.reduce((sum, d) => sum + parseFloat(d.earnings || '0'), 0);

      performance.push({
        deliveryAgent: agent,
        totalDeliveries: deliveries.length,
        totalEarnings: totalEarnings.toString(),
      });
    }

    return performance;
  }

  // Notifications
  async getNotifications(userId?: number): Promise<Notification[]> {
    if (userId) {
      // Get user-specific notifications
      const notifications = await db.select().from(schema.notifications)
        .where(eq(schema.notifications.userId, userId))
        .orderBy(desc(schema.notifications.createdAt));
      return notifications;
    }
    // Get all global notifications (where userId is null)
    const notifications = await db.select().from(schema.notifications)
      .orderBy(desc(schema.notifications.createdAt));
    return notifications;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(schema.notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId?: number): Promise<void> {
    const query = db.update(schema.notifications).set({ isRead: true });
    if (userId) {
      await query.where(eq(schema.notifications.userId, userId));
    } else {
      await query.where(eq(schema.notifications.userId, null as any));
    }
  }

  // Special Offers
  async getActiveSpecialOffers(): Promise<SpecialOffer[]> {
    const now = new Date();
    const offers = await db.select().from(schema.specialOffers)
      .where(and(
        eq(schema.specialOffers.isActive, true),
        // @ts-ignore
        schema.specialOffers.endsAt > now
      ))
      .orderBy(desc(schema.specialOffers.createdAt));
    return offers;
  }

  async getSpecialOffers(): Promise<SpecialOffer[]> {
    const offers = await db.select().from(schema.specialOffers)
      .orderBy(desc(schema.specialOffers.createdAt));
    return offers;
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const [created] = await db.insert(schema.specialOffers).values(offer).returning();
    return created;
  }

  async updateSpecialOffer(offerId: number, updates: Partial<SpecialOffer>): Promise<void> {
    await db.update(schema.specialOffers)
      .set(updates)
      .where(eq(schema.specialOffers.id, offerId));
  }

  async deleteSpecialOffer(offerId: number): Promise<void> {
    await db.delete(schema.specialOffers)
      .where(eq(schema.specialOffers.id, offerId));
  }
}

export const storage = new DatabaseStorage();
