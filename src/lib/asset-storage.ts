import { supabase } from "@/integrations/supabase/client";

export interface UserAsset {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  source_module: string;
  original_prompt: string | null;
  style: string | null;
  folder: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const BUCKET = "user-assets";

/** Upload a file to user-assets storage and index it in DB */
export async function persistAsset(opts: {
  file?: File;
  base64Data?: string;
  fileName: string;
  fileType?: string;
  sourceModule?: string;
  prompt?: string;
  style?: string;
  folder?: string;
  metadata?: Record<string, any>;
}): Promise<UserAsset | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ts = Date.now();
  const safeName = opts.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${ts}-${safeName}`;

  let uploadFile: File | Blob;
  let fileSize = 0;

  if (opts.file) {
    uploadFile = opts.file;
    fileSize = opts.file.size;
  } else if (opts.base64Data) {
    // Convert base64 data URL to blob
    const resp = await fetch(opts.base64Data);
    const blob = await resp.blob();
    uploadFile = blob;
    fileSize = blob.size;
  } else {
    return null;
  }

  // Upload to storage
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, uploadFile, { upsert: false });

  if (uploadErr) {
    console.error("[AssetStorage] Upload failed:", uploadErr);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Index in DB
  const record = {
    user_id: user.id,
    file_name: opts.fileName,
    file_type: opts.fileType || detectFileType(opts.fileName),
    file_size: fileSize,
    storage_path: storagePath,
    public_url: publicUrl,
    source_module: opts.sourceModule || "chat",
    original_prompt: opts.prompt || "",
    style: opts.style || "",
    folder: opts.folder || "",
    metadata: opts.metadata || {},
  };

  const { data, error } = await supabase
    .from("user_assets")
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("[AssetStorage] DB insert failed:", error);
    return null;
  }

  return data as unknown as UserAsset;
}

/** Persist a generated image (base64 or URL) */
export async function persistGeneratedImage(opts: {
  imageData: string;
  prompt: string;
  style?: string;
}): Promise<UserAsset | null> {
  const ext = opts.imageData.startsWith("data:image/png") ? "png" : "jpg";
  const fileName = `generated-${Date.now()}.${ext}`;
  return persistAsset({
    base64Data: opts.imageData,
    fileName,
    fileType: "image",
    sourceModule: "vision-forge",
    prompt: opts.prompt,
    style: opts.style,
  });
}

/** Persist a chat-uploaded file */
export async function persistChatUpload(file: File, publicUrl?: string): Promise<UserAsset | null> {
  return persistAsset({
    file,
    fileName: file.name,
    fileType: detectFileType(file.name),
    sourceModule: "chat-upload",
    metadata: publicUrl ? { originalChatUrl: publicUrl } : {},
  });
}

/** Load all user assets */
export async function loadUserAssets(opts?: {
  folder?: string;
  fileType?: string;
  search?: string;
  limit?: number;
}): Promise<UserAsset[]> {
  let query = supabase
    .from("user_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.folder) query = query.eq("folder", opts.folder);
  if (opts?.fileType) query = query.eq("file_type", opts.fileType);
  if (opts?.search) query = query.or(`file_name.ilike.%${opts.search}%,original_prompt.ilike.%${opts.search}%`);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) { console.error("[AssetStorage] Load failed:", error); return []; }
  return (data || []) as unknown as UserAsset[];
}

/** Delete an asset from both storage and DB */
export async function deleteUserAsset(asset: UserAsset): Promise<boolean> {
  const { error: storageErr } = await supabase.storage
    .from(BUCKET)
    .remove([asset.storage_path]);
  if (storageErr) console.warn("[AssetStorage] Storage delete warn:", storageErr);

  const { error: dbErr } = await supabase
    .from("user_assets")
    .delete()
    .eq("id", asset.id);

  if (dbErr) { console.error("[AssetStorage] DB delete failed:", dbErr); return false; }
  return true;
}

/** Update asset folder */
export async function moveAssetToFolder(assetId: string, folder: string): Promise<boolean> {
  const { error } = await supabase
    .from("user_assets")
    .update({ folder })
    .eq("id", assetId);
  return !error;
}

function detectFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "document";
  if (["csv", "xlsx", "xls"].includes(ext)) return "spreadsheet";
  if (["txt", "md"].includes(ext)) return "text";
  return "file";
}
