import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null
    const id = formData.get("id") as string | null

    if (!file || !type || !id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    if (!["avatar", "logo"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const supabase = createClient(
      "https://lujdnxyfwmaegszcwcqq.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const bucket = type === "avatar" ? "avatars" : "logos"
    const path = id + "/photo"
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    const urlWithBust = publicUrl + "?v=" + Date.now()

    if (type === "avatar") {
      await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", id)
    } else {
      await supabase.from("companies").update({ logo_url: urlWithBust }).eq("id", id)
    }

    return NextResponse.json({ url: urlWithBust })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
