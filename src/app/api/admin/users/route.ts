import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMasterAdminUser } from "@/lib/auth/roles";
import { z } from "zod";

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["suspend", "unsuspend", "delete", "set_role"]),
  role: z.enum(["superadmin", "owner", "manager"]).optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user || !isMasterAdminUser(user.email, user.app_metadata)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const admin = createAdminClient();

    if (validated.action === "suspend") {
      const { error } = await admin.auth.admin.updateUserById(validated.userId, {
        ban_duration: "876000h" // 100 years suspension
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "User suspended successfully" });
    }

    if (validated.action === "unsuspend") {
      const { error } = await admin.auth.admin.updateUserById(validated.userId, {
        ban_duration: "none"
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "User unsuspended successfully" });
    }

    if (validated.action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(validated.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "User deleted successfully" });
    }

    if (validated.action === "set_role" && validated.role) {
      const { error } = await admin.auth.admin.updateUserById(validated.userId, {
        app_metadata: { role: validated.role }
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: `Role updated to ${validated.role}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
