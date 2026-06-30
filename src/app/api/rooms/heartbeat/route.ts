import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { roomId, sessionId } = await req.json();
    
    if (!roomId || !sessionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing keys" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update joined_at to the server's current timestamp (immune to client clock drift)
    const { error } = await supabase
      .from("participants")
      .update({ joined_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("room_id", roomId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
