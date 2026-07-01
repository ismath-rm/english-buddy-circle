import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing keys" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Delete stale participants (older than 25 seconds) using the server's synchronized clock
    const cutoff = new Date(Date.now() - 25000).toISOString();
    await supabase
      .from("participants")
      .delete()
      .lt("joined_at", cutoff);

    // 2. Query rooms and active participants to find empty ones
    const { data: rooms } = await supabase
      .from("rooms")
      .select(`
        id,
        created_at,
        participants (
          id
        )
      `);

    if (rooms && rooms.length > 0) {
      const now = Date.now();
      const emptyRoomIds = rooms
        .filter((r: any) => {
          const createdTime = new Date(r.created_at).getTime();
          const ageInSeconds = (now - createdTime) / 1000;
          const count = r.participants ? r.participants.length : 0;
          return count === 0 && ageInSeconds > 600;
        })
        .map((r: any) => r.id);

      if (emptyRoomIds.length > 0) {
        await supabase
          .from("rooms")
          .delete()
          .in("id", emptyRoomIds);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
