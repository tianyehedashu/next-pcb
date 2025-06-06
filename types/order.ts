export interface Order {
  id: string;
  user_id: string | null; // Optional for guest orders
  status: 'pending' | 'processing' | 'completed' | 'cancelled'; // Example statuses
  price: number | null; // Price set by admin
  created_at: string;
  updated_at: string;
  admin_note: string | null;
  // Fields from the user quote form
  user_email: string; // Either from user.email or guestEmail
  user_phone: string | null;
  shipping_address: unknown; // TODO: Define a proper type for address
  pcb_spec_data: unknown; // TODO: Define a proper type for PCB specs
  gerber_file_url: string | null;
  analysis_result: unknown; // TODO: Define a proper type for analysis result
}

// TODO: Define more specific types for Address, PCB specs, Analysis result
// export interface ShippingAddress { ... }
// export interface PcbSpecData { ... }
// export interface AnalysisResult { ... } 