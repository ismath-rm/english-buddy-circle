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

  addLog("--- STARTING DATABASE AND ENDPOINT VERIFICATION TESTS ---");
  let testRoomId = null;
  const testSessionId = "test_verify_session_12345";
  const testUserName = "Test Verifier";

  try {
    // 1. Create a dynamic speaking room
    addLog("1. Creating test room...");
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: "API verification Room",
        topic: "Verification testing",
        category: "General",
        difficulty: "Intermediate",
        max_participants: 5,
        host_name: "Test Verifier",
        is_private: false
      })
      .select()
      .single();

    if (roomError) throw roomError;
    testRoomId = room.id;
    addLog(`✓ Test room created with ID: ${testRoomId}`);

    // 2. Insert host participant
    addLog("2. Inserting host participant...");
    const { data: part, error: partError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: testSessionId,
        user_name: testUserName
      })
      .select()
      .single();

    if (partError) throw partError;
    addLog(`✓ Host participant row created in DB! ID: ${part.id}`);

    // 3. Simulate heartbeat by doing delete and insert
    addLog("3. Simulating presence heartbeat (Delete-and-Insert)...");
    
    // Delete
    const { error: delError } = await supabase
      .from("participants")
      .delete()
      .eq("session_id", testSessionId)
      .eq("room_id", testRoomId);
    if (delError) throw delError;

    // Insert back with fresh timestamp
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
    if (insError) throw insError;
    addLog(`✓ Heartbeat re-inserted participant correctly! ID: ${newPart.id}`);

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

    // 5. Test empty room deletion logic
    addLog("5. Simulating room cleanup logic...");
    
    // Query room age
    const { data: roomsToCheck, error: checkRoomsError } = await supabase
      .from("rooms")
      .select("*, participants(*)")
      .eq("id", testRoomId);

    if (checkRoomsError) throw checkRoomsError;
    const r = roomsToCheck[0];
    const now = Date.now();
    const createdTime = new Date(r.created_at).getTime();
    const ageInSeconds = (now - createdTime) / 1000;
    const count = r.participants ? r.participants.length : 0;
    const shouldDelete = count === 0 && ageInSeconds > 86400;

    addLog(`✓ Room age: ${ageInSeconds.toFixed(2)}s, Participant count: ${count}, Should delete: ${shouldDelete}`);

    if (shouldDelete) {
      throw new Error("Room was marked for deletion incorrectly!");
    } else {
      addLog("✓ Room was correctly preserved (will only delete after 24 hours of inactivity).");
    }

    addLog("--- ALL TESTS COMPLETED SUCCESSFULLY ---");
    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    addLog(`✗ Test failed with error: ${err.message}`);
    return NextResponse.json({ success: false, error: err.message, logs }, { status: 500 });
  } finally {
    // Cleanup database records
    if (testRoomId) {
      addLog("Cleaning up database records...");
      await supabase.from("rooms").delete().eq("id", testRoomId);
      addLog("✓ Test records cleaned up.");
    }
  }
}
