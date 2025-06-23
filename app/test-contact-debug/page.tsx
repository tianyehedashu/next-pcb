"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestContactDebugPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testContactTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-contact-table');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Failed to test contact table',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const testContactSubmission = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Debug Test User',
          email: 'debug@test.com',
          phone: '+1234567890',
          company: 'Debug Company',
          projectType: 'prototype',
          message: 'This is a debug test message from the contact form.',
        }),
      });

      const data = await response.json();
      setResult({
        type: 'contact_submission',
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({ 
        type: 'contact_submission',
        success: false, 
        error: 'Failed to test contact submission',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmailOnly = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-admin-email-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: '🧪 Contact Form Email Test',
          html: '<h2>This is a test email from the contact form debug page</h2><p>If you received this email, the admin notification system is working correctly.</p>'
        }),
      });

      const data = await response.json();
      setResult({
        type: 'email_test',
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({ 
        type: 'email_test',
        success: false, 
        error: 'Failed to test email sending',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSMTPConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-smtp-config');
      const data = await response.json();
      setResult({
        type: 'smtp_config',
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({ 
        type: 'smtp_config',
        success: false, 
        error: 'Failed to check SMTP config',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Form Debug Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testContactTable}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Testing...' : 'Test Contact Table Structure'}
              </Button>
              
              <Button 
                onClick={testContactSubmission}
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Contact Form Submission'}
              </Button>

                             <Button 
                 onClick={testEmailOnly}
                 disabled={loading}
                 variant="secondary"
               >
                 {loading ? 'Testing...' : 'Test Email Only'}
               </Button>
               
               <Button 
                 onClick={checkSMTPConfig}
                 disabled={loading}
                 variant="outline"
               >
                 {loading ? 'Checking...' : 'Check SMTP Config'}
               </Button>
            </div>

            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Test Result:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>First, test the contact table structure to see if it exists and has the right fields</li>
              <li>Then, test the contact form submission to see the exact error</li>
              <li>Check the browser console and server logs for more details</li>
              <li>Ensure the contacts table has been created in the database</li>
              <li>Verify that the table has the correct permissions for anonymous users</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SQL Script to Run</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              If the table test fails, you may need to run this SQL script in your Supabase SQL editor:
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
{`-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    project_type TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert
CREATE POLICY "Allow anyone to create contacts" 
ON contacts FOR INSERT 
TO public 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON contacts TO anon;
GRANT ALL PRIVILEGES ON contacts TO service_role;`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 