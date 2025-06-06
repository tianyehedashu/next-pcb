"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Order } from '@/types/order'; // Adjust import path
import { createForm } from '@formily/core';
import { FormProvider, FormConsumer, Field } from '@formily/react';
import { Input, Select, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Button } from '@/components/ui'; // Assuming these are available or need to be created
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import * as z from 'zod';
import { toFormily } from '@formily/zod';

// Define the schema for the editable fields
// TODO: Expand this schema to include all editable fields from Order type
const OrderEditSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),
  price: z.number().nullable().optional(),
  admin_note: z.string().nullable().optional(),
});

const formilySchema = toFormily(OrderEditSchema);

interface AdminOrderDetailPageProps {
  params: { id: string };
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const router = useRouter();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = useState(() => createForm());

  // Fetch order data
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // TODO: Add actual authentication token to headers
        const response = await fetch(`/api/admin/orders?id=${orderId}`, {
          headers: {
            // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with real token
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order');
        }

        const data: Order = await response.json();
        setOrder(data);
        // Set form initial values after fetching data
        form.setValues({ ...data });

      } catch (err: unknown) {
        console.error('Error fetching order:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

  }, [orderId, form]); // Add form to dependency array

  // Handle form submission (updating order)
  const handleSubmit = async () => {
    if (!form || !orderId) return;

    try {
      // Validate form and get values
      await form.submit();
      const values = form.values; // Values will be validated by the schema

      console.log('Submitting updated order data:', values);

      // TODO: Add actual authentication token to headers
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with real token
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success('Order updated successfully!');
      // Optionally refetch order data or update local state
      // fetchOrder(); // Could refetch to show latest data including timestamps
      // setOrder({...order, ...values}); // Or update state locally

    } catch (err: unknown) {
      console.error('Error submitting order update:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Order Details</h2>
        <div className="bg-white rounded-lg shadow p-6 text-gray-500 text-center">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Order Details</h2>
        <div className="bg-white rounded-lg shadow p-6 text-red-600 text-center">Error loading order: {error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Order Details</h2>
        <div className="bg-white rounded-lg shadow p-6 text-gray-500 text-center">Order not found.</div>
      </div>
    );
  }

  return (
    <FormProvider form={form}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div>
            <h2 className="text-2xl font-bold">Order Details</h2>
            <p className="text-gray-600">View and edit details for Order ID: {orderId}</p>
           </div>
           <Button variant="outline" onClick={() => router.back()}>Back to Orders</Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>Details about the order and customer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <div className="text-sm font-medium text-gray-500">Order ID</div>
                    <div>{order.id}</div>
                 </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">User Email</div>
                    <div>{order.user_email} {order.user_id ? '' : '(Guest)'}</div>
                 </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Created At</div>
                    <div>{new Date(order.created_at).toLocaleString()}</div>
                 </div>
                   {/* TODO: Display more read-only fields like gerber file url, analysis result, shipping address, pcb spec data */}
                   <Separator />
                   {/* Editable Fields Form */}
                   <FormConsumer>
                       {() => (
                           <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                                <Field
                                    name="status"
                                    title="Status"
                                    decorator={[FormItem]}
                                    component={[Select, { placeholder: 'Select status' }]} // Use shadcn Select
                                    dataSource={[
                                        { label: 'Pending', value: 'pending' },
                                        { label: 'Processing', value: 'processing' },
                                        { label: 'Completed', value: 'completed' },
                                        { label: 'Cancelled', value: 'cancelled' },
                                    ]}
                                />
                                 <Field
                                    name="price"
                                    title="Price (USD)"
                                    decorator={[FormItem]}
                                    component={[Input, { type: 'number', placeholder: 'Enter price' }]} // Use shadcn Input
                                />
                                 <Field
                                    name="admin_note"
                                    title="Admin Note"
                                    decorator={[FormItem]}
                                     component={[Input, { type: 'textarea', placeholder: 'Add internal notes' }]} // Assuming textarea is an option or use a different component
                                />
                                {/* TODO: Add other editable fields if needed */}
                                <Button type="submit" className="mt-6">Save Changes</Button>
                           </form>
                       )}
                   </FormConsumer>
            </CardContent>
             {/* TODO: Add CardFooter for action buttons if needed */}
        </Card>
         {/* TODO: Add sections for Order History/Logs, Files, etc. */}
      </div>
    </FormProvider>
  );
} 