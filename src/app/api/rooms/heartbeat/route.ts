import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { roomId, sessionId, userName } = await req.json();
    
    if (!roomId || !sessionId || !userName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing keys" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Delete the old participant row to bypass RLS UPDATE restrictions
    await supabase
      .from("participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("room_id", roomId);

    // 2. Insert a fresh participant row with the server's synchronized timestamp
    const { error } = await supabase
      .from("participants")
      .insert({
        room_id: roomId,
        session_id: sessionId,
        user_name: userName,
        joined_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
