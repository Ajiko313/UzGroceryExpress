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

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData() {
  try {
    // Create categories
    const categories = [
      { nameUz: "Sabzavotlar", nameRu: "Овощи", nameEn: "Vegetables" },
      { nameUz: "Mevalar", nameRu: "Фрукты", nameEn: "Fruits" },
      { nameUz: "Sut mahsulotlari", nameRu: "Молочные продукты", nameEn: "Dairy" },
      { nameUz: "Non mahsulotlari", nameRu: "Хлебобулочные", nameEn: "Bakery" },
    ];

    for (const category of categories) {
      try {
        await storage.createCategory(category);
      } catch (error) {
        // Category might already exist
      }
    }

    // Create products
    const products = [
      {
        categoryId: 1,
        nameUz: "Pomidor",
        nameRu: "Помидор",
        nameEn: "Tomato",
        descriptionUz: "Toza, mahalliy",
        price: "12000",
        unit: "kg",
        image: "https://images.unsplash.com/photo-1546470427-e9bcd1a3da4a?w=400"
      },
      {
        categoryId: 1,
        nameUz: "Bodring",
        nameRu: "Огурец",
        nameEn: "Cucumber",
        descriptionUz: "Yangi, mazali",
        price: "8000",
        unit: "kg",
        image: "https://images.unsplash.com/photo-1549300079-323-02e209d9d3a6?w=400"
      },
      {
        categoryId: 1,
        nameUz: "Sabzi",
        nameRu: "Морковь",
        nameEn: "Carrot",
        descriptionUz: "Shirin, vitamin",
        price: "10000",
        unit: "kg",
        image: "https://images.unsplash.com/photo-1582515073490-39981397c445?w=400"
      },
      {
        categoryId: 3,
        nameUz: "Sut",
        nameRu: "Молоко",
        nameEn: "Milk",
        descriptionUz: "Toza, tabiiy 1L",
        price: "15000",
        unit: "dona",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"
      },
      {
        categoryId: 4,
        nameUz: "Non",
        nameRu: "Хлеб",
        nameEn: "Bread",
        descriptionUz: "An'anaviy, issiq",
        price: "3000",
        unit: "dona",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"
      },
      {
        categoryId: 4,
        nameUz: "Guruch",
        nameRu: "Рис",
        nameEn: "Rice",
        descriptionUz: "Osh uchun 1kg",
        price: "18000",
        unit: "kg",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"
      },
    ];

    for (const product of products) {
      try {
        await storage.createProduct(product);
      } catch (error) {
        // Product might already exist
      }
    }

    // Create sample users
    try {
      await storage.createUser({
        telegramId: "123456789",
        username: "customer1",
        firstName: "Dilshod",
        lastName: "Alimov",
        phoneNumber: "+998901234567",
        role: "customer"
      });
    } catch (error) {
      // User might already exist
    }

    try {
      await storage.createUser({
        telegramId: "987654321",
        username: "delivery1",
        firstName: "Akmal",
        lastName: "Karimov",
        phoneNumber: "+998907654321",
        role: "delivery_agent"
      });
    } catch (error) {
      // User might already exist
    }

  } catch (error) {
    console.error('Failed to initialize sample data:', error);
  }
}
