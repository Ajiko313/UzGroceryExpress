import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartSchema, insertOrderSchema, insertAddressSchema, insertDeliveryAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { initTelegramBot, handleTelegramWebhook, notifyTelegramUsers } from "./telegram";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize Telegram bot
  initTelegramBot();
  
  // Initialize sample data
  await initializeSampleData();

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = req.body.userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Special Offers
  app.get("/api/special-offers", async (req, res) => {
    try {
      const offers = await storage.getActiveSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const products = await storage.getProducts(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    try {
      // For demo, use user ID 1
      const userId = 1;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const userId = 1; // For demo
      const { productId, quantity = 1 } = req.body;
      
      const cartItem = await storage.addToCart({
        userId,
        productId,
        quantity
      });
      
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      await storage.updateCartItemQuantity(cartItemId, quantity);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.id);
      await storage.removeFromCart(cartItemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const userId = 1; // For demo
      await storage.clearCart(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Addresses
  app.post("/api/addresses", async (req, res) => {
    try {
      const userId = 1; // For demo
      const addressData = { ...req.body, userId };
      
      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = 1; // For demo
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/active", async (req, res) => {
    try {
      const userId = 1; // For demo
      const activeOrder = await storage.getActiveOrder(userId);
      res.json(activeOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const userId = 1; // For demo
      const { addressId, paymentMethod } = req.body;
      
      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      );
      const deliveryFee = 5000;
      const total = subtotal + deliveryFee;
      
      // Create order
      const order = await storage.createOrder({
        userId,
        addressId,
        paymentMethod,
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });
      
      // Add order items
      for (const cartItem of cartItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          pricePerUnit: cartItem.product.price,
          total: (parseFloat(cartItem.product.price) * cartItem.quantity).toString(),
        });
      }
      
      // Assign to delivery agent (simplified - just assign to agent ID 2)
      await storage.createDeliveryAssignment({
        orderId: order.id,
        deliveryAgentId: 2,
        earnings: '25000',
      });
      
      // Clear cart
      await storage.clearCart(userId);
      
      res.json(order);
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Delivery routes
  app.get("/api/delivery/assigned", async (req, res) => {
    try {
      const deliveryAgentId = 2; // For demo
      const orders = await storage.getAssignedOrders(deliveryAgentId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned orders" });
    }
  });

  app.get("/api/delivery/history", async (req, res) => {
    try {
      const deliveryAgentId = 2; // For demo
      const history = await storage.getDeliveryHistory(deliveryAgentId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery history" });
    }
  });

  app.get("/api/delivery/stats", async (req, res) => {
    try {
      const deliveryAgentId = 2; // For demo
      const stats = await storage.getDeliveryStats(deliveryAgentId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery stats" });
    }
  });

  app.patch("/api/delivery/orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateDeliveryStatus(orderId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });

  // Admin authentication middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const telegramId = req.body?.telegramId || req.query?.telegramId || req.headers['x-telegram-id'];
      if (!telegramId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId as string);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access denied" });
      }
      
      req.adminUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  };

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { telegramId, username } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ message: "Telegram ID required" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      res.json({ 
        success: true, 
        admin: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin - Get all orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { status, limit = 50 } = req.query;
      const orders = await storage.getAllOrders(status as string, parseInt(limit as string));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin - Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { role, limit = 100 } = req.query;
      const users = await storage.getAllUsers(role as string, parseInt(limit as string));
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin - Manage products
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const productData = req.body;
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const updates = req.body;
      await storage.updateProduct(productId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Admin - Manage categories
  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = req.body;
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const updates = req.body;
      await storage.updateCategory(categoryId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.updateCategory(categoryId, { isActive: false });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin - Assign delivery orders
  app.post("/api/admin/assignments", requireAdmin, async (req, res) => {
    try {
      const { orderId, deliveryAgentId, earnings } = req.body;
      const assignment = await storage.createDeliveryAssignment({
        orderId,
        deliveryAgentId,
        earnings
      });
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Admin - Update order status
  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateOrderStatus(orderId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin - Manage users
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      await storage.updateUser(userId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.updateUser(userId, { isActive: false });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Admin - Manage special offers
  app.get("/api/admin/special-offers", requireAdmin, async (req, res) => {
    try {
      const offers = await storage.getSpecialOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.post("/api/admin/special-offers", requireAdmin, async (req: any, res) => {
    try {
      const offerData = { ...req.body, createdBy: req.adminUser.id };
      const offer = await storage.createSpecialOffer(offerData);
      res.json(offer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create special offer" });
    }
  });

  app.patch("/api/admin/special-offers/:id", requireAdmin, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const updates = req.body;
      await storage.updateSpecialOffer(offerId, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update special offer" });
    }
  });

  app.delete("/api/admin/special-offers/:id", requireAdmin, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      await storage.deleteSpecialOffer(offerId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete special offer" });
    }
  });

  // Admin - Manage notifications
  app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const notificationData = req.body;
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Admin - Get delivery performance
  app.get("/api/admin/delivery-performance", requireAdmin, async (req, res) => {
    try {
      const performance = await storage.getDeliveryPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery performance" });
    }
  });

  // Telegram Bot Webhook
  app.post("/api/telegram/webhook", handleTelegramWebhook);

  // Telegram Authentication
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramUser } = req.body;
      
      if (!telegramUser?.id) {
        return res.status(400).json({ message: "Invalid Telegram user data" });
      }

      // Find or create user
      let user = await storage.getUserByTelegramId(telegramUser.id.toString());
      
      if (!user) {
        user = await storage.createUser({
          telegramId: telegramUser.id.toString(),
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          role: 'customer'
        });
      }

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Notification broadcast to Telegram
  app.post("/api/notifications/broadcast", async (req, res) => {
    try {
      const { message, userRole } = req.body;
      
      // Send to database notifications
      const notification = await storage.createNotification({
        title: 'System Notification',
        message,
        userId: userRole === 'admin' ? undefined : 1, // Broadcast to all if no specific user
        type: 'system'
      });

      // Send to Telegram users
      await notifyTelegramUsers(message, userRole);

      res.json({ success: true, notification });
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ message: "Failed to broadcast notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData() {
  try {
    // Check if data already exists
    const existingCategories = await storage.getCategories();
    if (existingCategories.length > 0) {
      console.log('✅ Sample data already exists, skipping initialization');
      return;
    }

    console.log('🌱 Initializing sample data...');

    // Create categories with attractive photos
    const categories = [
      { nameUz: "Sabzavotlar", nameRu: "Овощи", nameEn: "Vegetables", image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop&auto=format" },
      { nameUz: "Mevalar", nameRu: "Фрукты", nameEn: "Fruits", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop&auto=format" },
      { nameUz: "Sut mahsulotlari", nameRu: "Молочные продукты", nameEn: "Dairy", image: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&h=300&fit=crop&auto=format" },
      { nameUz: "Non mahsulotlari", nameRu: "Хлебобулочные", nameEn: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&auto=format" },
      { nameUz: "Go'sht mahsulotlari", nameRu: "Мясные продукты", nameEn: "Meat", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&auto=format" },
      { nameUz: "Ichimliklar", nameRu: "Напитки", nameEn: "Beverages", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&auto=format" },
    ];

    for (const category of categories) {
      await storage.createCategory(category);
    }

    // Create essential products (smaller set for faster initialization)
    const products = [
      { categoryId: 1, nameUz: "Pomidor", nameRu: "Помидор", nameEn: "Tomato", descriptionUz: "Toza mahalliy pomidor", price: "12000", unit: "kg", image: "https://images.unsplash.com/photo-1546470427-e9bcd1a3da4a?w=400" },
      { categoryId: 1, nameUz: "Bodring", nameRu: "Огурец", nameEn: "Cucumber", descriptionUz: "Yangi mazali bodring", price: "8000", unit: "kg", image: "https://images.unsplash.com/photo-1549300079-323-02e209d9d3a6?w=400" },
      { categoryId: 2, nameUz: "Olma", nameRu: "Яблоко", nameEn: "Apple", descriptionUz: "Shirin qizil olma", price: "18000", unit: "kg", image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400" },
      { categoryId: 2, nameUz: "Banan", nameRu: "Банан", nameEn: "Banana", descriptionUz: "Pishgan banan", price: "22000", unit: "kg", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" },
      { categoryId: 3, nameUz: "Sut", nameRu: "Молоко", nameEn: "Milk", descriptionUz: "Toza tabiiy sut 1L", price: "15000", unit: "dona", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
    ];

    for (const product of products) {
      await storage.createProduct(product);
    }

    // Create essential users
    const users = [
      { telegramId: "100001", username: "test_customer", firstName: "Test", lastName: "Customer", phoneNumber: "+998901234567", role: "customer" },
      { telegramId: "200001", username: "test_delivery", firstName: "Test", lastName: "Delivery", phoneNumber: "+998907654321", role: "delivery_agent" },
      { telegramId: "300001", username: "admin_user", firstName: "Admin", lastName: "User", phoneNumber: "+998901111111", role: "admin" },
    ];

    for (const user of users) {
      await storage.createUser(user);
    }

    // Create sample address
    const address = { userId: 1, street: "Test Street 1", city: "Toshkent", district: "Test District", latitude: "41.311158", longitude: "69.279737" };
    await storage.createAddress(address);

    console.log('✅ Sample data initialized successfully!');

  } catch (error) {
    console.error('❌ Failed to initialize sample data:', error);
    // Don't throw error - let app continue without sample data
  }
}
