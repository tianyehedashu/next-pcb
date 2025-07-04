import { createClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: quote, error: queryError } = await supabase
      .from("pcb_quotes")
      .select("*")
      .eq("id", id)
      .is("user_id", null)
      .single();

    if (queryError) {
      console.error("Error fetching quote:", queryError);
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    const { data: quote, error: updateError } = await supabase
      .from("pcb_quotes")
      .update({
        status: body.status,
        admin_quote_price: body.admin_quote_price,
        admin_notes: body.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating quote:", updateError);
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