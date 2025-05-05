import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getPublicFileUrl(path: string) {
  if (!path) return "";
  const { data } = supabase.storage.from("next-pcb").getPublicUrl(path);
  console.log(data,path);
  return data.publicUrl || "";
} 