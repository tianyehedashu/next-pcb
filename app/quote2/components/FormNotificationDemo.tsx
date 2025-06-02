"use client";

import React from "react";
import { createForm } from "@formily/core";
import { FormProvider, Field } from "@formily/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormNotificationContainer } from "./FormNotificationSystem";
import { EnhancedFieldWrapper } from "./EnhancedFormilyField";
import { formilyComponents } from "./FormilyComponents";

// 模拟获取子分类选项的函数
const getSubcategoryOptions = (category: string) => {
  const options: Record<string, Array<{ label: string; value: string }>> = {
    electronics: [
      { label: "Smartphones", value: "smartphones" },
      { label: "Laptops", value: "laptops" },
      { label: "Tablets", value: "tablets" }
    ],
    clothing: [
      { label: "T-Shirts", value: "tshirts" },
      { label: "Jeans", value: "jeans" },
      { label: "Shoes", value: "shoes" }
    ],
    books: [
      { label: "Fiction", value: "fiction" },
      { label: "Non-Fiction", value: "nonfiction" },
      { label: "Technical", value: "technical" }
    ]
  };

  return {
    options: options[category] || []
  };
};

export function FormNotificationDemo() {
  const [form] = React.useState(() => 
    createForm({
      initialValues: {},
      effects: () => {
        // 注册全局函数供 reactions 使用
        (globalThis as Record<string, unknown>).getSubcategoryOptions = getSubcategoryOptions;
      }
    })
  );

  const handleSubmit = () => {
    form.submit((values) => {
      console.log('Demo form submitted:', values);
      alert('Form submitted! Check console for values.');
    });
  };

  const handleReset = () => {
    form.reset();
  };

  return (
    <FormProvider form={form}>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 通知系统 */}
        <FormNotificationContainer />
        
        <Card>
          <CardHeader>
            <CardTitle>Form Notification System Demo</CardTitle>
            <p className="text-sm text-gray-600">
              Try changing values to see automatic adjustments, option updates, and visibility changes.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Field */}
            <Field
              name="category"
              component={[formilyComponents.Select]}
              decorator={[EnhancedFieldWrapper]}
              title="Product Category"
              description="Select a category to see subcategory options appear"
            />

            {/* Subcategory Field - becomes visible when category is selected */}
            <Field
              name="subcategory"
              component={[formilyComponents.Select]}
              decorator={[EnhancedFieldWrapper]}
              title="Subcategory"
              description="Options change based on selected category"
            />

            {/* Quantity Field */}
            <Field
              name="quantity"
              component={[formilyComponents.NumberInput]}
              decorator={[EnhancedFieldWrapper]}
              title="Quantity"
              description="Enter more than 100 to see priority auto-adjust to 'High'"
            />

            {/* Priority Field - auto-adjusts based on quantity */}
            <Field
              name="priority"
              component={[formilyComponents.TabSelect]}
              decorator={[EnhancedFieldWrapper]}
              title="Priority Level"
              description="Automatically set to 'High' when quantity > 100"
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset Form
              </Button>
              <Button type="button" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Try These Actions:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Select a category</strong> - Watch the subcategory field appear with relevant options</li>
              <li>• <strong>Change category</strong> - See how subcategory options update automatically</li>
              <li>• <strong>Enter quantity &gt; 100</strong> - Priority will auto-adjust to &ldquo;High&rdquo;</li>
              <li>• <strong>Watch for notifications</strong> - They appear in the top-right corner</li>
              <li>• <strong>Look for visual indicators</strong> - Blue dots show auto-adjusted values</li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Auto-Adjustment Notifications</h3>
          <p className="text-sm text-gray-600">
            Try these actions to test the notification system:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Change layers from 2 to 4 - thickness should auto-adjust and show notification</li>
            <li>Change copper weight to 3oz - thickness should auto-adjust and show notification</li>
            <li>Manually change thickness - should NOT show auto-adjustment notification</li>
            <li>Change layers back to 2 - thickness should auto-adjust again</li>
          </ul>
        </div>
      </div>
    </FormProvider>
  );
}

export default FormNotificationDemo; 