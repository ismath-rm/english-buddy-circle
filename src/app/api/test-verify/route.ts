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
  const testSessionId = "test_verify_session_12345";

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
        session_id: testSessionId,
        user_name: "Test Participant"
      })
      .select()
      .single();

    if (partError) throw partError;
    addLog(`✓ Participant inserted: ${part.id}`);

    // 3. Simulating presence heartbeat via Dummy-Participant-Insert strategy
    addLog("3. Simulating presence heartbeat via Dummy-Participant strategy...");
    
    // a. Insert dummy participant to protect room from trigger deletion
    const dummySessionId = `system_dummy_${testRoomId}_${Math.random().toString(36).substring(2)}`;
    const { data: dummyPart, error: dummyInsError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: dummySessionId,
        user_name: "System"
      })
      .select()
      .single();

    if (dummyInsError) {
      addLog(`✗ Dummy insert failed: ${dummyInsError.message}`);
      throw dummyInsError;
    }
    addLog("✓ Dummy participant inserted successfully.");

    // b. Delete Host participant
    const { error: delError } = await supabase
      .from("participants")
      .delete()
      .eq("session_id", testSessionId)
      .eq("room_id", testRoomId);
    if (delError) {
      addLog(`✗ Host delete failed: ${delError.message}`);
      throw delError;
    }
    addLog("✓ Host participant deleted.");

    // c. Insert Host participant back with fresh timestamp
    const { data: newPart, error: insError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: testSessionId,
        user_name: testUserName,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insError) {
      addLog(`✗ Host re-insert failed: ${insError.message}`);
      throw insError;
    }
    addLog("✓ Host participant re-inserted.");

    // d. Delete dummy participant
    const { error: dummyDelError } = await supabase
      .from("participants")
      .delete()
      .eq("session_id", dummySessionId)
      .eq("room_id", testRoomId);
    if (dummyDelError) {
      addLog(`✗ Dummy delete failed: ${dummyDelError.message}`);
      throw dummyDelError;
    }
    addLog("✓ Dummy participant cleaned up.");

    // 4. Verify participant timestamp exists
    addLog("4. Verifying database record state after heartbeat...");
    const { data: updatedParts, error: fetchError } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId)
      .eq("session_id", testSessionId);

    if (fetchError) throw fetchError;
    if (updatedParts.length !== 1) {
      throw new Error(`Expected exactly 1 participant row, but found: ${updatedParts.length}`);
    }
    const updatedRecord = updatedParts[0];
    addLog(`✓ Heartbeat preserved participant presence row correctly! joined_at: ${updatedRecord.joined_at}`);

    // 5. Deleting participant to check room deletion
    addLog("5. Deleting participant to check room deletion...");
    const { error: deleteError } = await supabase
      .from("participants")
      .delete()
      .eq("id", newPart.id);

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
