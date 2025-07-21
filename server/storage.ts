import { eq, and, desc } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

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
  CartItem, InsertCartItem
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export const storage = new DatabaseStorage();
