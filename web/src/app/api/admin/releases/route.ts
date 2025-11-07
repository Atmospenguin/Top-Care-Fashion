import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

function env(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`${name} is required`);
  return v;
}

async function ensurePublicBucket(supabase: any, bucket: string) {
  const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true });
  if (createErr && !String(createErr.message || "").toLowerCase().includes("already exists")) {
    const { error: updateErr } = await supabase.storage.updateBucket(bucket, { public: true });
    if (updateErr) {
      console.warn(`Could not ensure bucket ${bucket} is public:`, updateErr);
    }
  }
}

// GET - List all releases
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const supabase = await createSupabaseServer();
    const { data: releases, error } = await supabase
      .from("releases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching releases:", error);
      return NextResponse.json({ error: "Failed to fetch releases" }, { status: 500 });
    }

    return NextResponse.json({ releases: releases || [] });
  } catch (error: any) {
    console.error("Error in GET /api/admin/releases:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Upload new release
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    
    const form = await req.formData();
    const file = form.get("file");
    const version = form.get("version") as string;
    const releaseNotes = form.get("releaseNotes") as string;
    const setAsCurrent = form.get("setAsCurrent") === "true";
    const platform = "android";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!version) {
      return NextResponse.json({ error: "Version is required" }, { status: 400 });
    }

    const bucket = "releases";
    await ensurePublicBucket(supabaseAdmin, bucket);

    // Upload file to storage
    const fileName = file.name;
    const path = `${platform}/${version}/${fileName}`;
    const arrayBuf = await file.arrayBuffer();
    
    const { error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, Buffer.from(arrayBuf), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      console.error("Upload error:", upErr);
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    const fileUrl = data.publicUrl;

    // Save release info to database
    const supabase = await createSupabaseServer();
    
    // If setAsCurrent, unset other current releases for this platform
    if (setAsCurrent) {
      await supabase
        .from("releases")
        .update({ is_current: false })
        .eq("platform", platform);
    }

    const { data: release, error: dbError } = await supabase
      .from("releases")
      .insert({
        version,
        platform,
        file_url: fileUrl,
        file_name: fileName,
        file_size: file.size,
        release_notes: releaseNotes || null,
        is_current: setAsCurrent,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from(bucket).remove([path]);
      return NextResponse.json({ error: `Failed to save release: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ release, message: "Release uploaded successfully" });
  } catch (error: any) {
    console.error("Error in POST /api/admin/releases:", error);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}

