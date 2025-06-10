import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PCBFieldConfig {
  key: string;
  shouldShow: (data: Record<string, unknown>) => boolean;
}
interface PCBFieldGroup {
  title: string;
  fields: PCBFieldConfig[];
}

interface OrderOverviewTabsProps {
  order: Record<string, unknown>;
  pcbFieldGroups: PCBFieldGroup[];
  pcbFieldLabelMap: Record<string, string>;
  pcbFieldValueMap: Record<string, (value: unknown) => string>;
  hidePriceDetailsTab?: boolean;
}

export function OrderOverviewTabs({ order, pcbFieldGroups, pcbFieldLabelMap, pcbFieldValueMap, hidePriceDetailsTab }: OrderOverviewTabsProps) {
  // 类型断言
  const userOrder = order as any;
  const pcbSpec = userOrder.pcb_spec as Record<string, unknown> | undefined;
  const calValues = userOrder.cal_values as any;
  return (
    <Card className="mb-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pcb">PCB</TabsTrigger>
          {!hidePriceDetailsTab && <TabsTrigger value="price">Price</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview">
          <CardHeader>
            <CardTitle>User & Order Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Email: {userOrder.email as string}</div>
            <div>User ID: {userOrder.user_id || "Guest"}</div>
            <div>User Name: {userOrder.user_name || "-"}</div>
            <div>Order ID: {userOrder.id as string}</div>
            <div>Status: {userOrder.status as string}</div>
            <div>Created At: {userOrder.created_at ? new Date(userOrder.created_at as string).toLocaleString() : "-"}</div>
            {/* 其他关键信息可补充 */}
          </CardContent>
        </TabsContent>
        <TabsContent value="pcb">
          <CardHeader>
            <CardTitle>PCB Info</CardTitle>
          </CardHeader>
          <CardContent>
            {pcbSpec && typeof pcbSpec === "object" ? (
              pcbFieldGroups.map((group) => (
                <div key={group.title} className="mb-2">
                  <div className="font-semibold text-gray-700 mb-1">{group.title}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {group.fields.map((field) => {
                      if (!field.shouldShow(pcbSpec)) return null;
                      const value = pcbSpec[field.key];
                      if (value === undefined || value === null || value === "") return null;
                      return (
                        <React.Fragment key={field.key}>
                          <div className="font-medium text-gray-600">{pcbFieldLabelMap[field.key] || field.key}</div>
                          <div className="text-gray-900">
                            {pcbFieldValueMap[field.key] ? pcbFieldValueMap[field.key](value) : String(value)}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">无PCB参数</div>
            )}
          </CardContent>
        </TabsContent>
        {!hidePriceDetailsTab && (
          <TabsContent value="price">
            <CardHeader>
              <CardTitle>Price Details</CardTitle>
            </CardHeader>
            <CardContent>
              {calValues && (
                <div>
                  <div>Total Price: {calValues.price} CNY</div>
                  <div>Total Area: {calValues.totalArea} ㎡</div>
                  {/* 其他价格明细可补充 */}
                  <div className="mt-2 font-semibold">Price Notes:</div>
                  <ul className="list-disc pl-5 text-sm text-gray-900">
                    {calValues.priceNotes?.map((note: string, i: number) => <li key={i}>{note}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
} 