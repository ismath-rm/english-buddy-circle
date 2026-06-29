import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing keys" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Delete all rooms from the rooms table
  const { error } = await supabase
    .from("rooms")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "All rooms deleted successfully!" });
}
