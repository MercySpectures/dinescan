import PublicMenuClient, { PublicItem } from "@/app/menu/[slug]/client";

const demoItems: PublicItem[] = [
  {
    id: "1",
    category: "Starters",
    name: "Paneer Tikka",
    description: "Smoky, char-grilled paneer with herbs.",
    price: 289,
    imageUrl: "https://placehold.co/600x360/png",
    isVeg: true,
    isFeatured: true
  },
  {
    id: "2",
    category: "Mains",
    name: "Chicken Biryani",
    description: "Slow-cooked basmati rice and tender chicken.",
    price: 399,
    imageUrl: "https://placehold.co/600x360/png",
    isVeg: false,
    isFeatured: true
  }
];

export default function DemoMenuPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <div className="mt-6">
        <PublicMenuClient
          items={demoItems}
          restaurant={{
            id: "demo",
            slug: "demo",
            name: "DineScan Demo",
            address: "MG Road, Bengaluru",
            phone: "+91 90000 00000"
          }}
        />
      </div>
    </main>
  );
}
