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

  addLog("--- STARTING END-TO-END MULTI-USER LIFECYCLE TEST ---");
  let testRoomId = null;
  const hostSessionId = "e2e_host_session_123";
  const guestSessionId = "e2e_guest_session_456";

  try {
    // 1. Create room
    addLog("1. Creating room...");
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name: "E2E Verification Room",
        topic: "E2E Verification",
        category: "General",
        difficulty: "Intermediate",
        max_participants: 5,
        host_name: "Host User",
        is_private: false
      })
      .select()
      .single();

    if (roomError) throw roomError;
    testRoomId = room.id;
    addLog(`✓ Room created: ${testRoomId}`);

    // 2. Host enters
    addLog("2. Host entering room...");
    const { error: hostInsertError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: hostSessionId,
        user_name: "Host User"
      });
    if (hostInsertError) throw hostInsertError;
    addLog("✓ Host participant inserted.");

    // 3. Simulate Host heartbeat
    addLog("3. Simulating Host heartbeat presence refresh...");
    const hbResponse = await fetch(`${new URL(request.url).origin}/api/rooms/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: testRoomId,
        sessionId: hostSessionId,
        userName: "Host User"
      })
    });
    if (!hbResponse.ok) {
      const errText = await hbResponse.text();
      throw new Error(`Host heartbeat API failed: ${errText}`);
    }
    addLog("✓ Host heartbeat API request processed successfully.");

    // 4. Verify Host is still present
    const { data: partsAfterHb, error: fetchError1 } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId);
    if (fetchError1) throw fetchError1;
    addLog(`✓ Participants after heartbeat: ${partsAfterHb.length} (Expected: 1)`);
    if (partsAfterHb.length !== 1 || partsAfterHb[0].session_id !== hostSessionId) {
      throw new Error("Host presence verify failed!");
    }

    // 5. Guest joins
    addLog("5. Guest joining room...");
    const { error: guestInsertError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: guestSessionId,
        user_name: "Guest User"
      });
    if (guestInsertError) throw guestInsertError;
    addLog("✓ Guest participant inserted.");

    // 6. Verify room has 2 participants
    const { data: partsWithGuest, error: fetchError2 } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId);
    if (fetchError2) throw fetchError2;
    addLog(`✓ Participants list size: ${partsWithGuest.length} (Expected: 2)`);
    if (partsWithGuest.length !== 2) {
      throw new Error("Guest join verification failed!");
    }

    // 7. Guest leaves
    addLog("7. Guest leaving room...");
    const { error: guestDeleteError } = await supabase
      .from("participants")
      .delete()
      .eq("session_id", guestSessionId)
      .eq("room_id", testRoomId);
    if (guestDeleteError) throw guestDeleteError;
    addLog("✓ Guest participant deleted.");

    // 8. Verify room has 1 participant (Host)
    const { data: partsAfterGuestLeave, error: fetchError3 } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId);
    if (fetchError3) throw fetchError3;
    addLog(`✓ Participants count after Guest left: ${partsAfterGuestLeave.length} (Expected: 1)`);
    if (partsAfterGuestLeave.length !== 1 || partsAfterGuestLeave[0].session_id !== hostSessionId) {
      throw new Error("Guest leave verification failed!");
    }

    // 9. Guest rejoins
    addLog("9. Guest rejoining room...");
    const { error: guestRejoinError } = await supabase
      .from("participants")
      .insert({
        room_id: testRoomId,
        session_id: guestSessionId,
        user_name: "Guest User"
      });
    if (guestRejoinError) throw guestRejoinError;
    addLog("✓ Guest participant re-inserted.");

    // 10. Verify room has 2 participants again
    const { data: partsAfterRejoin, error: fetchError4 } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId);
    if (fetchError4) throw fetchError4;
    addLog(`✓ Participants count after Guest rejoined: ${partsAfterRejoin.length} (Expected: 2)`);
    if (partsAfterRejoin.length !== 2) {
      throw new Error("Guest rejoin verification failed!");
    }

    // 11. Simulate Host heartbeat again (while Guest is inside)
    addLog("11. Simulating Host heartbeat with Guest in room...");
    const hbResponse2 = await fetch(`${new URL(request.url).origin}/api/rooms/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: testRoomId,
        sessionId: hostSessionId,
        userName: "Host User"
      })
    });
    if (!hbResponse2.ok) {
      const errText = await hbResponse2.text();
      throw new Error(`Host heartbeat API failed: ${errText}`);
    }
    addLog("✓ Host heartbeat API request processed successfully.");

    // 12. Verify room still has 2 participants
    const { data: partsFinal, error: fetchError5 } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", testRoomId);
    if (fetchError5) throw fetchError5;
    addLog(`✓ Final participants count: ${partsFinal.length} (Expected: 2)`);
    if (partsFinal.length !== 2) {
      throw new Error("Final heartbeat verification failed!");
    }

    addLog("--- ALL E2E LIFECYCLE TESTS COMPLETED SUCCESSFULLY ---");
    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    addLog(`✗ E2E test failed with error: ${err.message}`);
    return NextResponse.json({ success: false, error: err.message, logs }, { status: 500 });
  } finally {
    if (testRoomId) {
      addLog("Cleaning up database test records...");
      await supabase.from("rooms").delete().eq("id", testRoomId);
      addLog("✓ Database cleaned up.");
    }
  }
}
