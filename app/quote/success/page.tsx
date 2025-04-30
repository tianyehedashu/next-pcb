"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function QuoteSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle2 className="text-green-500 mb-2" size={48} />
          <CardTitle className="text-2xl font-bold">Quote Submitted Successfully</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">
            Thank you for your quote request!<br />
            Our team will review your submission and contact you soon.
          </p>
          <Link href="/">
            <Button variant="default" className="w-full">Back to Home</Button>
          </Link>
          <Link href="/quote">
            <Button variant="outline" className="w-full">Submit Another Quote</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
} 