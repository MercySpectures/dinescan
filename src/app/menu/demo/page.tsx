import { Metadata } from "next";
import PublicMenuClient, { PublicItem } from "@/app/menu/[slug]/client";

export const metadata: Metadata = {
  title: "Live Public Cafe Menu Demo | DineScan",
  description: "Experience DineScan's ultra-fast table self-ordering menu with high-converting digital ordering, chef recommendations, and instant KOT dispatch."
};

const demoItems: PublicItem[] = [
  {
    id: "demo-1",
    category: "Starters",
    name: "Crispy Paneer Tikka",
    description: "Charcoal-grilled cottage cheese cubes marinated in mustard yogurt, Kashmiri paprika & crushed ajwain.",
    price: 289,
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: true,
    preparationTime: 12
  },
  {
    id: "demo-2",
    category: "Starters",
    name: "Smoked Tandoori Chicken Tikka",
    description: "Succulent boneless chicken morsels infused with garlic mint marinade, roasted in traditional clay oven.",
    price: 349,
    imageUrl: "https://images.unsplash.com/photo-1527477378308-1e0e7638c340?w=800&auto=format&fit=crop&q=80",
    isVeg: false,
    isFeatured: true,
    preparationTime: 15
  },
  {
    id: "demo-3",
    category: "Main Course",
    name: "Old Delhi Butter Chicken",
    description: "Tender roasted chicken simmered in a velvety sun-ripened tomato & cashew gravy with fresh cream and fenugreek.",
    price: 399,
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
    isVeg: false,
    isFeatured: true,
    preparationTime: 18
  },
  {
    id: "demo-4",
    category: "Main Course",
    name: "Dal Makhani Royale",
    description: "Slow-cooked black urad lentils simmered overnight over slow charcoal with churned butter and dairy cream.",
    price: 299,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: false,
    preparationTime: 10
  },
  {
    id: "demo-5",
    category: "Biryani & Rice",
    name: "Hyderabadi Dum Chicken Biryani",
    description: "Aged long-grain basmati rice layered with marinated chicken, saffron milk, fried shallots, served with burani raita.",
    price: 429,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    isVeg: false,
    isFeatured: true,
    preparationTime: 20
  },
  {
    id: "demo-6",
    category: "Breads",
    name: "Garlic Butter Naan Basket",
    description: "Clay-oven baked leavened bread brushed generously with roasted garlic butter and fresh cilantro.",
    price: 119,
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: false,
    preparationTime: 6
  },
  {
    id: "demo-7",
    category: "Main Course",
    name: "Artisanal Truffle Margherita",
    description: "Wood-fired sourdough crust with San Marzano tomatoes, buffalo mozzarella, fresh basil, and white truffle glaze.",
    price: 449,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: true,
    preparationTime: 15
  },
  {
    id: "demo-8",
    category: "Beverages",
    name: "Ratnagiri Alphonso Mango Lassi",
    description: "Thick hand-churned yogurt blended with authentic sweet Alphonso mango pulp and toasted pistachio slivers.",
    price: 149,
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: true,
    preparationTime: 5
  },
  {
    id: "demo-9",
    category: "Beverages",
    name: "Cold Brew Iced Mocha",
    description: "Single-origin Arabica slow steeped for 18 hours, shaken with dark Belgian chocolate and chilled creamy milk.",
    price: 179,
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: false,
    preparationTime: 5
  },
  {
    id: "demo-10",
    category: "Desserts",
    name: "Royal Saffron Gulab Jamun with Rabri",
    description: "Warm golden khoya dumplings soaked in green cardamom rose syrup, accompanied by chilled rich saffron rabri.",
    price: 189,
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    isVeg: true,
    isFeatured: true,
    preparationTime: 8
  }
];

export default function DemoMenuPage() {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <PublicMenuClient
        items={demoItems}
        restaurant={{
          id: "demo-bistro",
          slug: "demo",
          name: "The Royal Bistro & Kitchen",
          address: "100 Feet Road, Indiranagar, Bengaluru",
          phone: "+91 80 4123 4567",
          logo_url: "/logo.jpg",
          theme_color: "#10B981"
        }}
      />
    </div>
  );
}
