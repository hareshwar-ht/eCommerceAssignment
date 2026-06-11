import { Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MOCK_WISHLIST = [
  { id: 'PROD-1', name: 'Premium Wireless Headphones', price: '$199.99', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80' },
  { id: 'PROD-2', name: 'Mechanical Keyboard', price: '$129.50', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=200&q=80' },
];

export default function WishlistTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Your Wishlist</h2>
      {MOCK_WISHLIST.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Heart className="mb-4 size-12 text-muted-foreground" />
          <CardTitle>Your wishlist is empty</CardTitle>
          <CardDescription>Save items you like to your wishlist.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_WISHLIST.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square w-full bg-muted">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1 text-lg">{item.name}</CardTitle>
                <CardDescription className="text-lg font-bold text-foreground">{item.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button className="flex-1">Add to Cart</Button>
                  <Button variant="outline" size="icon">
                    <Heart className="size-4 fill-current" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
