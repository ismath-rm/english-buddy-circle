import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== "antigravity") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: string[] = [];
  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  addLog("--- STARTING DB TRIGGER BEHAVIOR TEST ---");
  let testRoomId = null;

  try {
    // 1. Create a room
    addLog("1. Creating test room...");
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: "Trigger Test Room",
        topic: "Testing triggers",
        category: "General",
        difficulty: "Intermediate",
        max_participants: 5,
        host_name: "Test Host",
        is_private: false
      })
      .select()
      .single();

    if (roomError) throw roomError;
    testRoomId = room.id;
    addLog(`✓ Room created with ID: ${testRoomId}`);

    // 2. Add participant
    addLog("2. Inserting participant...");
    const { data: part, error: partError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: "trigger_test_session_999",
        user_name: "Test Participant"
      })
      .select()
      .single();

    if (partError) throw partError;
    addLog(`✓ Participant inserted: ${part.id}`);

    // 3. Delete participant
    addLog("3. Deleting participant...");
    const { error: deleteError } = await supabase
      .from("participants")
      .delete()
      .eq("id", part.id);

    if (deleteError) throw deleteError;
    addLog("✓ Participant deleted.");

    // 4. Check if the room still exists in the database
    addLog("4. Checking if room still exists in the database...");
    const { data: checkRoom, error: checkError } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", testRoomId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (checkRoom) {
      addLog("✓ Room STILL EXISTS! (No immediate database trigger or cascade deleted it)");
      // Cleanup manually
      await supabase.from("rooms").delete().eq("id", testRoomId);
      addLog("✓ Room manually cleaned up successfully.");
    } else {
      addLog("✗ Room WAS DELETED immediately when participant was deleted! (A database trigger or cascade exists!)");
    }

    addLog("--- TEST COMPLETED SUCCESSFULLY ---");
    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    addLog(`✗ Test failed with error: ${err.message}`);
    return NextResponse.json({ success: false, error: err.message, logs }, { status: 500 });
  }
}
