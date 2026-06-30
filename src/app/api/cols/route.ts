import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing keys" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch one row from participants table
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  return NextResponse.json({ success: true, columns, data });
}
