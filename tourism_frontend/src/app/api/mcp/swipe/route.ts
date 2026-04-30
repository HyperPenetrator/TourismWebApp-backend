import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, target_id, action, category } = body;

    // Simulate backend processing delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (action === 'SWIPE_RIGHT') {
      return NextResponse.json({
        status: "success",
        action: "SWIPE_RIGHT",
        user_id: user_id || "demo_user",
        artisan_id: target_id,
        affinity_update: {
          category: category || "Cultural Heritage",
          previous_score: 0.1200,
          delta: 0.1500,
          new_score: 0.2700,
        },
        timestamp: new Date().toISOString(),
        engine_note: "Feed will prioritize similar profiles in next render cycle."
      });
    }

    if (action === 'SWIPE_LEFT') {
      return NextResponse.json({
        status: "success",
        action: "SWIPE_LEFT",
        user_id: user_id || "demo_user",
        artisan_id: target_id,
        archive_result: {
          was_already_archived: false,
          total_archived_count: 1,
          cleared_affinity_category: category || "Cultural Heritage",
        },
        filter_applied: true,
        timestamp: new Date().toISOString(),
        engine_note: "Profile excluded from feed. Preference graph updated."
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
