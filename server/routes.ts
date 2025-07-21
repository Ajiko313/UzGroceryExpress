import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartSchema, insertOrderSchema, insertAddressSchema, insertDeliveryAssignmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize sample data
  await initializeSampleData();

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

  // Admin - Get delivery performance
  app.get("/api/admin/delivery-performance", requireAdmin, async (req, res) => {
    try {
      const performance = await storage.getDeliveryPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData() {
  try {
    console.log('🌱 Initializing comprehensive sample data...');

    // Create categories
    const categories = [
      { nameUz: "Sabzavotlar", nameRu: "Овощи", nameEn: "Vegetables", image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400" },
      { nameUz: "Mevalar", nameRu: "Фрукты", nameEn: "Fruits", image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400" },
      { nameUz: "Sut mahsulotlari", nameRu: "Молочные продукты", nameEn: "Dairy", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { nameUz: "Non mahsulotlari", nameRu: "Хлебобулочные", nameEn: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { nameUz: "Go'sht mahsulotlari", nameRu: "Мясные продукты", nameEn: "Meat", image: "https://images.unsplash.com/photo-1588347818148-9d1920bf85c6?w=400" },
      { nameUz: "Ichimliklar", nameRu: "Напитки", nameEn: "Beverages", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
      { nameUz: "Donli mahsulotlar", nameRu: "Зерновые", nameEn: "Grains", image: "https://images.unsplash.com/photo-1571005518241-3adfb7e5a7be?w=400" },
    ];

    for (const category of categories) {
      try {
        await storage.createCategory(category);
      } catch (error) {
        // Category might already exist
      }
    }

    // Create extensive product catalog
    const products = [
      // Vegetables (Category 1)
      { categoryId: 1, nameUz: "Pomidor", nameRu: "Помидор", nameEn: "Tomato", descriptionUz: "Toza mahalliy pomidor", descriptionRu: "Свежие местные помидоры", price: "12000", unit: "kg", image: "https://images.unsplash.com/photo-1546470427-e9bcd1a3da4a?w=400" },
      { categoryId: 1, nameUz: "Bodring", nameRu: "Огурец", nameEn: "Cucumber", descriptionUz: "Yangi mazali bodring", descriptionRu: "Свежие огурцы", price: "8000", unit: "kg", image: "https://images.unsplash.com/photo-1549300079-323-02e209d9d3a6?w=400" },
      { categoryId: 1, nameUz: "Sabzi", nameRu: "Морковь", nameEn: "Carrot", descriptionUz: "Shirin vitamin sabzi", descriptionRu: "Сладкая морковь", price: "10000", unit: "kg", image: "https://images.unsplash.com/photo-1582515073490-39981397c445?w=400" },
      { categoryId: 1, nameUz: "Kartoshka", nameRu: "Картофель", nameEn: "Potato", descriptionUz: "Sifatli kartoshka", descriptionRu: "Качественный картофель", price: "6000", unit: "kg", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400" },
      { categoryId: 1, nameUz: "Piyoz", nameRu: "Лук", nameEn: "Onion", descriptionUz: "O'tkir piyoz", descriptionRu: "Острый лук", price: "7000", unit: "kg", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400" },
      { categoryId: 1, nameUz: "Sarimsoq", nameRu: "Чеснок", nameEn: "Garlic", descriptionUz: "Toza sarimsoq", descriptionRu: "Свежий чеснок", price: "25000", unit: "kg", image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400" },
      
      // Fruits (Category 2)
      { categoryId: 2, nameUz: "Olma", nameRu: "Яблоко", nameEn: "Apple", descriptionUz: "Shirin qizil olma", descriptionRu: "Сладкие красные яблоки", price: "18000", unit: "kg", image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400" },
      { categoryId: 2, nameUz: "Banan", nameRu: "Банан", nameEn: "Banana", descriptionUz: "Pishgan banan", descriptionRu: "Спелые бананы", price: "22000", unit: "kg", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" },
      { categoryId: 2, nameUz: "Apelsin", nameRu: "Апельсин", nameEn: "Orange", descriptionUz: "Vitamin C bilan boy", descriptionRu: "Богатые витамином C", price: "20000", unit: "kg", image: "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400" },
      { categoryId: 2, nameUz: "Uzum", nameRu: "Виноград", nameEn: "Grapes", descriptionUz: "Shirin uzum", descriptionRu: "Сладкий виноград", price: "35000", unit: "kg", image: "https://images.unsplash.com/photo-1599819177322-9b3aeb10b279?w=400" },
      
      // Dairy (Category 3)
      { categoryId: 3, nameUz: "Sut", nameRu: "Молоко", nameEn: "Milk", descriptionUz: "Toza tabiiy sut 1L", descriptionRu: "Натуральное молоко 1L", price: "15000", unit: "dona", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { categoryId: 3, nameUz: "Tvorog", nameRu: "Творог", nameEn: "Cottage Cheese", descriptionUz: "Toza tvorog 500g", descriptionRu: "Свежий творог 500g", price: "12000", unit: "dona", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400" },
      { categoryId: 3, nameUz: "Sariyog'", nameRu: "Сливочное масло", nameEn: "Butter", descriptionUz: "Tabiiy sariyog' 200g", descriptionRu: "Натуральное масло 200g", price: "35000", unit: "dona", image: "https://images.unsplash.com/photo-1589985269298-0a2f4e6b1f72?w=400" },
      
      // Bakery (Category 4)
      { categoryId: 4, nameUz: "Non", nameRu: "Хлеб", nameEn: "Bread", descriptionUz: "An'anaviy issiq non", descriptionRu: "Традиционный горячий хлеб", price: "3000", unit: "dona", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { categoryId: 4, nameUz: "Lavash", nameRu: "Лаваш", nameEn: "Lavash", descriptionUz: "Yupqa lavash", descriptionRu: "Тонкий лаваш", price: "2000", unit: "dona", image: "https://images.unsplash.com/photo-1598966739654-5e85229c3334?w=400" },
      { categoryId: 4, nameUz: "Guruch", nameRu: "Рис", nameEn: "Rice", descriptionUz: "Sifatli guruch 1kg", descriptionRu: "Качественный рис 1kg", price: "18000", unit: "kg", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      
      // Meat (Category 5)
      { categoryId: 5, nameUz: "Mol go'shti", nameRu: "Говядина", nameEn: "Beef", descriptionUz: "Toza mol go'shti", descriptionRu: "Свежая говядина", price: "65000", unit: "kg", image: "https://images.unsplash.com/photo-1588347818148-9d1920bf85c6?w=400" },
      { categoryId: 5, nameUz: "Tovuq go'shti", nameRu: "Курица", nameEn: "Chicken", descriptionUz: "Toza tovuq go'shti", descriptionRu: "Свежая курица", price: "28000", unit: "kg", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400" },
      
      // Beverages (Category 6)
      { categoryId: 6, nameUz: "Suv", nameRu: "Вода", nameEn: "Water", descriptionUz: "Toza ichimlik suvi 1.5L", descriptionRu: "Питьевая вода 1.5L", price: "3000", unit: "dona", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
      { categoryId: 6, nameUz: "Choy", nameRu: "Чай", nameEn: "Tea", descriptionUz: "Qora choy 100g", descriptionRu: "Черный чай 100g", price: "15000", unit: "dona", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
      
      // Grains (Category 7)
      { categoryId: 7, nameUz: "Bugdoy uni", nameRu: "Пшеничная мука", nameEn: "Wheat Flour", descriptionUz: "Yuqori navli un 1kg", descriptionRu: "Мука высшего сорта 1kg", price: "8000", unit: "kg", image: "https://images.unsplash.com/photo-1571005518241-3adfb7e5a7be?w=400" },
      { categoryId: 7, nameUz: "Makaron", nameRu: "Макароны", nameEn: "Pasta", descriptionUz: "Sifatli makaron 500g", descriptionRu: "Качественные макароны 500g", price: "12000", unit: "dona", image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400" },
    ];

    for (const product of products) {
      try {
        await storage.createProduct(product);
      } catch (error) {
        // Product might already exist
      }
    }

    // Create comprehensive user base
    const users = [
      // Customers
      { telegramId: "100001", username: "dilshod_customer", firstName: "Dilshod", lastName: "Alimov", phoneNumber: "+998901234567", role: "customer" },
      { telegramId: "100002", username: "madina_customer", firstName: "Madina", lastName: "Karimova", phoneNumber: "+998909876543", role: "customer" },
      { telegramId: "100003", username: "bekzod_customer", firstName: "Bekzod", lastName: "Toshev", phoneNumber: "+998905555555", role: "customer" },
      { telegramId: "100004", username: "nigora_customer", firstName: "Nigora", lastName: "Rahimova", phoneNumber: "+998907777777", role: "customer" },
      { telegramId: "100005", username: "javohir_customer", firstName: "Javohir", lastName: "Saidov", phoneNumber: "+998908888888", role: "customer" },
      
      // Delivery Agents
      { telegramId: "200001", username: "akmal_delivery", firstName: "Akmal", lastName: "Karimov", phoneNumber: "+998907654321", role: "delivery_agent" },
      { telegramId: "200002", username: "shohruh_delivery", firstName: "Shohruh", lastName: "Otaev", phoneNumber: "+998906543210", role: "delivery_agent" },
      { telegramId: "200003", username: "farrux_delivery", firstName: "Farrux", lastName: "Abdullayev", phoneNumber: "+998905432109", role: "delivery_agent" },
      { telegramId: "200004", username: "bobur_delivery", firstName: "Bobur", lastName: "Hasanov", phoneNumber: "+998904321098", role: "delivery_agent" },
      { telegramId: "200005", username: "doniyor_delivery", firstName: "Doniyor", lastName: "Nazarov", phoneNumber: "+998903210987", role: "delivery_agent" },
      
      // Admin Users
      { telegramId: "300001", username: "admin_main", firstName: "Admin", lastName: "Boshqaruvchi", phoneNumber: "+998901111111", role: "admin" },
      { telegramId: "300002", username: "admin_manager", firstName: "Menejer", lastName: "Rahbar", phoneNumber: "+998902222222", role: "admin" },
    ];

    for (const user of users) {
      try {
        await storage.createUser(user);
      } catch (error) {
        // User might already exist
      }
    }

    // Create sample addresses for customers
    const addresses = [
      { userId: 1, street: "Amir Temur ko'chasi 15", city: "Toshkent", district: "Yunusobod", latitude: "41.311158", longitude: "69.279737" },
      { userId: 1, street: "Mustaqillik ko'chasi 8", city: "Toshkent", district: "Chilonzor", latitude: "41.275568", longitude: "69.203637" },
      { userId: 2, street: "O'zbekiston ko'chasi 25", city: "Toshkent", district: "Mirobod", latitude: "41.285568", longitude: "69.213637" },
      { userId: 3, street: "Sharaf Rashidov ko'chasi 12", city: "Toshkent", district: "Shayxontohur", latitude: "41.295568", longitude: "69.223637" },
      { userId: 4, street: "Bobur ko'chasi 7", city: "Toshkent", district: "Olmazor", latitude: "41.305568", longitude: "69.233637" },
    ];

    for (const address of addresses) {
      try {
        await storage.createAddress(address);
      } catch (error) {
        // Address might already exist
      }
    }

    console.log('✅ Successfully initialized comprehensive sample data!');
    console.log('📊 Created: 7 categories, 22 products, 12 users (5 customers, 5 delivery agents, 2 admins), 5 addresses');

  } catch (error) {
    console.error('❌ Failed to initialize sample data:', error);
  }
}
