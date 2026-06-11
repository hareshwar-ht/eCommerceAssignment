import { PackageOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MOCK_ORDERS = [
  { id: 'ORD-1001', date: '2026-06-10', total: '$129.99', status: 'Delivered', items: 2 },
  { id: 'ORD-1002', date: '2026-06-05', total: '$45.00', status: 'Processing', items: 1 },
];

export default function OrdersTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Order History</h2>
      {MOCK_ORDERS.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <PackageOpen className="mb-4 size-12 text-muted-foreground" />
          <CardTitle>No orders yet</CardTitle>
          <CardDescription>When you place an order, it will appear here.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4">
          {MOCK_ORDERS.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Order {order.id}</CardTitle>
                  <CardDescription>Placed on {order.date}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{order.total}</div>
                  <div
                    className={`text-sm ${
                      order.status === 'Delivered' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    {order.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">{order.items} items in this order</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
