import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  restaurantName: z.string().min(2, "Restaurant or business name is required"),
  city: z.string().optional(),
  venueType: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = contactSchema.parse(body);

    // Try logging lead to Supabase
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminSupabase: any = createAdminClient();
      await adminSupabase.from("contact_leads").insert([
        {
          name: validated.name,
          email: validated.email,
          phone: validated.phone,
          business_name: validated.restaurantName,
          city: validated.city || "Not specified",
          venue_type: validated.venueType || "Restaurant",
          message: validated.message,
          created_at: new Date().toISOString()
        }
      ]);
    } catch {
      // If contact_leads table does not exist, log to console gracefully
      console.log("Contact lead received:", validated);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for reaching out! A DineScan specialist will contact you within 2 business hours."
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
