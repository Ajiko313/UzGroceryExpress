import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  user: { firstName: string; lastName: string };
  address: { street: string; city: string };
  items: Array<{
    product: { nameUz: string };
    quantity: number;
    price: string;
  }>;
}

interface Product {
  id: number;
  nameUz: string;
  price: string;
  unit: string;
  isAvailable: boolean;
  categoryId: number;
  category: { nameUz: string };
}

interface Category {
  id: number;
  nameUz: string;
  _count: { products: number };
}

interface DeliveryAgent {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  activeOrders: number;
  totalDeliveries: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<DeliveryAgent[]>({
    queryKey: ['/api/admin/delivery-agents'],
  });

  // Mutations
  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Buyurtma holati yangilandi" });
    }
  });

  const assignDelivery = useMutation({
    mutationFn: ({ orderId, agentId }: { orderId: number; agentId: number }) =>
      apiRequest(`/api/admin/orders/${orderId}/assign`, {
        method: 'PATCH',
        body: { agentId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Yetkazuvchi tayinlandi" });
    }
  });

  const toggleProductAvailability = useMutation({
    mutationFn: ({ productId, isAvailable }: { productId: number; isAvailable: boolean }) =>
      apiRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: { isAvailable }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "Mahsulot holati yangilandi" });
    }
  });

  // Statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isAvailable).length,
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.isActive).length,
    todayRevenue: orders
      .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.total, 0)
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock },
      confirmed: { variant: "default" as const, icon: CheckCircle },
      preparing: { variant: "default" as const, icon: Package },
      delivering: { variant: "default" as const, icon: Truck },
      delivered: { variant: "default" as const, icon: CheckCircle },
      cancelled: { variant: "destructive" as const, icon: AlertCircle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{status}</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
            <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
            <TabsTrigger value="categories">Kategoriyalar</TabsTrigger>
            <TabsTrigger value="agents">Yetkazuvchilar</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jami buyurtmalar</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingOrders} ta kutilmoqda
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mahsulotlar</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeProducts} ta mavjud
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yetkazuvchilar</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeAgents} ta faol
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bugungi daromad</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Bugungi kun
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>So'nggi buyurtmalar</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.user.firstName} {order.user.lastName}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Buyurtmalar boshqaruvi</h2>
              <Input 
                placeholder="Buyurtma qidirish..." 
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>Manzil</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.user.firstName} {order.user.lastName}</TableCell>
                        <TableCell>{order.address.street}, {order.address.city}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'confirmed' })}
                              >
                                Tasdiqlash
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mahsulotlar boshqaruvi</h2>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Mahsulot qidirish..." 
                  className="max-w-sm"
                />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yangi mahsulot
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Narx</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.nameUz}</TableCell>
                        <TableCell>{product.category.nameUz}</TableCell>
                        <TableCell>{formatPrice(parseInt(product.price))}</TableCell>
                        <TableCell>
                          <Badge variant={product.isAvailable ? "default" : "secondary"}>
                            {product.isAvailable ? "Mavjud" : "Mavjud emas"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={product.isAvailable ? "secondary" : "default"}
                              size="sm"
                              onClick={() => toggleProductAvailability.mutate({ 
                                productId: product.id, 
                                isAvailable: !product.isAvailable 
                              })}
                            >
                              {product.isAvailable ? "O'chirish" : "Yoqish"}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Kategoriyalar boshqaruvi</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi kategoriya
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.nameUz}</span>
                      <Badge variant="secondary">{category._count.products} ta</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Delivery Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Yetkazuvchilar boshqaruvi</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi yetkazuvchi
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ism-familiya</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Faol buyurtmalar</TableHead>
                      <TableHead>Jami yetkazilgan</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          {agent.firstName} {agent.lastName}
                        </TableCell>
                        <TableCell>{agent.phone}</TableCell>
                        <TableCell>
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.isActive ? "Faol" : "Faol emas"}
                          </Badge>
                        </TableCell>
                        <TableCell>{agent.activeOrders}</TableCell>
                        <TableCell>{agent.totalDeliveries}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={agent.isActive ? "secondary" : "default"}
                              size="sm"
                            >
                              {agent.isActive ? "Faolsizlashtirish" : "Faollashtirish"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}