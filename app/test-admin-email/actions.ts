'use server';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { sendAdminNotification } from "@/lib/utils/sendEmail";

export async function sendTestEmailAction(subject: string, html: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createSupabaseServerClient();
        // The sendAdminNotification function requires a client with admin capabilities.
        // We assume createSupabaseServerClient() returns a client with the necessary permissions.
        // If not, we might need to create an admin client explicitly here.
        await sendAdminNotification(supabase, subject, html);
        return { success: true };
    } catch (error) {
        console.error("sendTestEmailAction failed:", error);
        return { success: false, error: (error as Error).message };
    }
} 