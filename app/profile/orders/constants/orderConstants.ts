export const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string }> = {
  'created': { text: "Created", style: "bg-blue-100 text-blue-800 border-blue-200", description: "Quote request submitted" },
  'pending': { text: "Pending", style: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Under review" },
  'quoted': { text: "Quoted", style: "bg-green-100 text-green-800 border-green-200", description: "Quote ready" },
  'reviewed': { text: "Reviewed", style: "bg-green-100 text-green-800 border-green-200", description: "Ready for payment" },
  'confirmed': { text: "Confirmed", style: "bg-indigo-100 text-indigo-800 border-indigo-200", description: "Order confirmed" },
  'paid': { text: "Paid", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Payment completed" },
  'in_production': { text: "In Production", style: "bg-blue-100 text-blue-800 border-blue-200", description: "Manufacturing in progress" },
  'shipped': { text: "Shipped", style: "bg-cyan-100 text-cyan-800 border-cyan-200", description: "Order shipped" },
  'delivered': { text: "Delivered", style: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Order delivered" },
  'completed': { text: "Completed", style: "bg-green-100 text-green-800 border-green-200", description: "Order completed" },
  'cancelled': { text: "Cancelled", style: "bg-red-100 text-red-800 border-red-200", description: "Order cancelled" },
  'refunded': { text: "Refunded", style: "bg-purple-100 text-purple-800 border-purple-200", description: "Order refunded" },
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const DEFAULT_SORT_FIELD = 'created_at';
export const DEFAULT_SORT_ORDER = 'desc';

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'created', label: 'Created' },
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export const SEARCH_COLUMNS = [
  { value: 'order_id', label: 'Order ID' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;

export const DEFAULT_SEARCH_COLUMN = 'order_id'; 