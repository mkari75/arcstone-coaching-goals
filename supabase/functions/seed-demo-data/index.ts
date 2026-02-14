import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const password = "Demo2024!";

    const users = [
      { email: "mardi@arcstoneinc.com", name: "Mardi Kari", roles: ["super_admin", "manager"] },
      { email: "manager@arcstoneinc.com", name: "Regional Manager", roles: ["manager"] },
      { email: "lo@arcstoneinc.com", name: "Demo LO", roles: ["loan_officer"] },
      { email: "sarah@arcstoneinc.com", name: "Sarah Chen", roles: ["loan_officer"] },
      { email: "jake@arcstoneinc.com", name: "Jake Morrison", roles: ["loan_officer"] },
      { email: "lisa@arcstoneinc.com", name: "Lisa Park", roles: ["loan_officer"] },
      { email: "carlos@arcstoneinc.com", name: "Carlos Rivera", roles: ["loan_officer"] },
    ];

    const createdUsers: { id: string; email: string; name: string; roles: string[] }[] = [];

    for (const u of users) {
      // Check if user already exists
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

      let userId: string;
      if (existing) {
        userId = existing.id;
        console.log(`User ${u.email} already exists: ${userId}`);
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: u.name },
        });
        if (error) {
          console.error(`Failed to create ${u.email}:`, error.message);
          continue;
        }
        userId = data.user.id;
        console.log(`Created user ${u.email}: ${userId}`);
      }

      // Ensure profile exists
      const { data: profile } = await admin.from("profiles").select("id").eq("user_id", userId).maybeSingle();
      if (!profile) {
        await admin.from("profiles").insert({
          user_id: userId,
          email: u.email,
          full_name: u.name,
          momentum_score: Math.floor(Math.random() * 400) + 200,
          current_streak: Math.floor(Math.random() * 15),
          longest_streak: Math.floor(Math.random() * 30) + 5,
          daily_completion_avg: Math.floor(Math.random() * 40) + 50,
        });
      } else {
        await admin.from("profiles").update({
          full_name: u.name,
          momentum_score: Math.floor(Math.random() * 400) + 200,
          current_streak: Math.floor(Math.random() * 15),
          longest_streak: Math.floor(Math.random() * 30) + 5,
          daily_completion_avg: Math.floor(Math.random() * 40) + 50,
        }).eq("user_id", userId);
      }

      // Assign roles
      for (const role of u.roles) {
        const { error: roleErr } = await admin.from("user_roles").upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" }
        );
        if (roleErr) console.error(`Role error for ${u.email}:`, roleErr.message);
      }

      createdUsers.push({ id: userId, email: u.email, name: u.name, roles: u.roles });
    }

    // Get LO user IDs for demo data
    const loUsers = createdUsers.filter(u => u.roles.includes("loan_officer"));

    // Seed contacts for each LO
    const contactTypes = ["realtor", "builder", "financial_planner", "attorney", "past_client", "referral_partner"];
    const contactNames = [
      "Alex Thompson", "Maria Garcia", "David Kim", "Rachel Foster",
      "James Wilson", "Priya Patel", "Tom Bradley", "Nancy Lee",
      "Robert Chen", "Amanda Burke", "Kevin O'Brien", "Diana Flores",
      "Chris Nguyen", "Stephanie Adams", "Mark Hernandez", "Julie Wang",
    ];

    let contactIdx = 0;
    for (const lo of loUsers) {
      const numContacts = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numContacts; i++) {
        const name = contactNames[contactIdx % contactNames.length];
        contactIdx++;
        await admin.from("contacts").insert({
          user_id: lo.id,
          name,
          contact_type: contactTypes[Math.floor(Math.random() * contactTypes.length)],
          email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
          phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          company: ["Keller Williams", "RE/MAX", "Century 21", "Coldwell Banker", "Smith & Associates"][Math.floor(Math.random() * 5)],
          health_score: Math.floor(Math.random() * 60) + 40,
          health_status: ["excellent", "good", "neutral", "at_risk"][Math.floor(Math.random() * 4)],
          loans_closed: Math.floor(Math.random() * 8),
          total_volume: Math.floor(Math.random() * 2000000) + 200000,
          total_touches: Math.floor(Math.random() * 20) + 3,
          referrals_received: Math.floor(Math.random() * 5),
          last_contact_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
          days_since_contact: Math.floor(Math.random() * 30),
        });
      }
    }

    // Seed activities for each LO
    const activityTypes = ["phone_call", "email", "meeting", "text_message", "referral_follow_up", "loan_application"];
    const activityCategories = ["prospecting", "follow_up", "relationship_building", "pipeline_management"];
    const descriptions = [
      "Called to discuss refinance options",
      "Sent market update email",
      "Coffee meeting to discuss referral partnership",
      "Followed up on pre-approval application",
      "Texted about new listing in their area",
      "Discussed first-time buyer program options",
      "Reviewed loan application documents",
      "Sent thank you note after closing",
    ];

    for (const lo of loUsers) {
      const numActivities = 8 + Math.floor(Math.random() * 8);
      for (let i = 0; i < numActivities; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const completedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
        await admin.from("activities").insert({
          user_id: lo.id,
          activity_type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
          activity_category: activityCategories[Math.floor(Math.random() * activityCategories.length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          status: "completed",
          completed_at: completedAt,
          points: Math.floor(Math.random() * 20) + 5,
          impact_level: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        });
      }
    }

    // Seed daily power moves for each LO (last 14 days)
    for (const lo of loUsers) {
      for (let d = 0; d < 14; d++) {
        const date = new Date(Date.now() - d * 86400000);
        const dateStr = date.toISOString().split("T")[0];
        const m1Done = Math.random() > 0.3;
        const m2Done = Math.random() > 0.4;
        const m3Done = Math.random() > 0.5;
        const completed = [m1Done, m2Done, m3Done].filter(Boolean).length;

        await admin.from("daily_power_moves").insert({
          user_id: lo.id,
          assigned_date: dateStr,
          move_1_description: "Call 3 referral partners",
          move_1_completed: m1Done,
          move_1_completed_at: m1Done ? date.toISOString() : null,
          move_1_points: m1Done ? 15 : 0,
          move_2_description: "Follow up on 2 pending applications",
          move_2_completed: m2Done,
          move_2_completed_at: m2Done ? date.toISOString() : null,
          move_2_points: m2Done ? 15 : 0,
          move_3_description: "Send market update to past clients",
          move_3_completed: m3Done,
          move_3_completed_at: m3Done ? date.toISOString() : null,
          move_3_points: m3Done ? 15 : 0,
          completion_percentage: Math.round((completed / 3) * 100),
          total_points: completed * 15,
          daily_grade: completed === 3 ? "A" : completed === 2 ? "B" : completed === 1 ? "C" : "F",
        });
      }
    }

    // Seed leaderboard data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    for (let i = 0; i < loUsers.length; i++) {
      const lo = loUsers[i];
      const points = Math.floor(Math.random() * 500) + 200;
      await admin.from("leaderboard_data").upsert({
        user_id: lo.id,
        period_type: "monthly",
        period_start: monthStart,
        period_end: monthEnd,
        total_points: points,
        completion_percentage: Math.floor(Math.random() * 40) + 50,
        activities_logged: Math.floor(Math.random() * 30) + 10,
        loans_closed: Math.floor(Math.random() * 6) + 1,
        volume_closed: Math.floor(Math.random() * 3000000) + 500000,
        rank_by_points: i + 1,
        rank_by_volume: loUsers.length - i,
        rank_by_loans: Math.floor(Math.random() * loUsers.length) + 1,
        tier: points >= 600 ? "Platinum" : points >= 400 ? "Gold" : points >= 200 ? "Silver" : "Bronze",
        calculated_at: now.toISOString(),
      }, { onConflict: "user_id,period_type,period_start" });
    }

    // Seed a few team alerts
    if (loUsers.length > 0) {
      await admin.from("team_alerts").insert([
        {
          loan_officer_id: loUsers[0].id,
          alert_type: "no_activity",
          severity: "warning",
          title: "No Recent Activity",
          description: `${loUsers[0].name} has not logged activities in 5 days`,
        },
        {
          loan_officer_id: loUsers[1]?.id || loUsers[0].id,
          alert_type: "low_completion",
          severity: "info",
          title: "Below Target Completion",
          description: "Daily power move completion below 50% this week",
        },
      ]);
    }

    // Seed celebration feed
    for (const lo of loUsers.slice(0, 3)) {
      await admin.from("celebration_feed").insert({
        user_id: lo.id,
        celebration_type: "achievement",
        title: `${lo.name} hit a new milestone!`,
        description: "Completed 10 consecutive days of power moves",
        is_public: true,
        like_count: Math.floor(Math.random() * 8),
        comment_count: Math.floor(Math.random() * 3),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo data seeded successfully",
        users: createdUsers.map(u => ({ email: u.email, name: u.name, roles: u.roles })),
        password,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
