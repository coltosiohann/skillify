import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text.slice(0, 12000);

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType: "application/pdf" });

    if (uploadErr) throw uploadErr;

    // Insert document record
    const { data: doc, error: dbErr } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        course_id: null,
        file_name: file.name,
        storage_path: storagePath,
        extracted_text: extractedText,
      })
      .select("id")
      .single();

    if (dbErr) throw dbErr;

    return NextResponse.json({ id: doc.id, extractedText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
