import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: quote, error } = await supabase
      .from("pcb_quotes")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error fetching quote:", error);
      return NextResponse.json(
        { error: "Failed to fetch quote" },
        { status: 500 }
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error in quote detail API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();

    const { data: quote, error } = await supabase
      .from("pcb_quotes")
      .update({
        status: body.status,
        admin_quote_price: body.admin_quote_price,
        admin_notes: body.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quote:", error);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error in quote update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 