"use client";

import { useEffect, useState } from "react";
import { Search, Download, Phone, ShoppingBag, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  favoriteDish: string;
}

const sampleCustomers: CustomerRecord[] = [
  { id: "cust-1", name: "Rahul Sharma", phone: "+91 98765 43210", totalOrders: 8, totalSpent: 4250, lastVisit: "Today, 08:30 PM", favoriteDish: "Paneer Tikka, Butter Naan" },
  { id: "cust-2", name: "Priya Patel", phone: "+91 98123 45678", totalOrders: 5, totalSpent: 2890, lastVisit: "Yesterday, 02:15 PM", favoriteDish: "Veg Biryani, Mango Lassi" },
  { id: "cust-3", name: "Amit Verma", phone: "+91 99887 76655", totalOrders: 12, totalSpent: 7800, lastVisit: "05 Sep 2026", favoriteDish: "Butter Chicken, Garlic Naan" },
  { id: "cust-4", name: "Sneha Kapur", phone: "+91 97654 32109", totalOrders: 3, totalSpent: 1450, lastVisit: "03 Sep 2026", favoriteDish: "Crispy Paneer, Cold Coffee" },
  { id: "cust-5", name: "Vikram Malhotra", phone: "+91 98989 12121", totalOrders: 15, totalSpent: 11200, lastVisit: "01 Sep 2026", favoriteDish: "Dal Makhani, Jeera Rice" }
];

export default function CustomersCRMPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>(sampleCustomers);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // Collect customer names & phones from local orders if present
    const savedName = localStorage.getItem("dinescan_customer_name");
    const savedPhone = localStorage.getItem("dinescan_customer_phone");
    if (savedName && savedPhone) {
      setCustomers((prev) => {
        if (prev.some((c) => c.phone === savedPhone)) return prev;
        return [
          {
            id: `cust-${Date.now()}`,
            name: savedName,
            phone: savedPhone,
            totalOrders: 1,
            totalSpent: 630,
            lastVisit: "Just now",
            favoriteDish: "Paneer Tikka"
          },
          ...prev
        ];
      });
    }
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.favoriteDish.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Customer Name", "Phone Number", "Total Orders", "Total Spent (INR)", "Last Visit", "Favorite Dishes"];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.totalOrders,
      c.totalSpent,
      `"${c.lastVisit}"`,
      `"${c.favoriteDish}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DineScan_Customer_CRM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported customer CRM contacts CSV successfully!");
  };

  const handleWhatsAppChat = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Hi ${name}! Thank you for dining with us at our cafe. Here is an exclusive 10% discount coupon for your next table scan: DINESCAN10!`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Customer CRM & Contact Data</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collected diner contacts, order frequency, lifetime spend, and 1-click WhatsApp promotion tools.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="btn-primary px-4 py-2.5 text-xs flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" /> Export Customer CSV
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Collected Customers</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{customers.length}</p>
        </div>
        <div className="card p-5 border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Lifetime Spend</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="card p-5 border border-teal-500/20 bg-teal-500/5">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Avg. Orders per Diner</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            {(customers.reduce((sum, c) => sum + c.totalOrders, 0) / (customers.length || 1)).toFixed(1)} Orders
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by customer name, phone number, or favorite dish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white outline-none"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="font-bold text-sm text-slate-900 dark:text-white">Customer Contact Directory</span>
          <span className="text-xs text-emerald-500 font-mono">Real-time table QR collection</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Phone Number</th>
                <th className="px-6 py-3.5">Orders</th>
                <th className="px-6 py-3.5">Total Spent</th>
                <th className="px-6 py-3.5">Last Visit</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">
                    {c.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" /> {c.phone}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-indigo-400" /> {c.totalOrders} visits
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {c.lastVisit}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleWhatsAppChat(c.phone, c.name)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Promo
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                    No matching customer contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
