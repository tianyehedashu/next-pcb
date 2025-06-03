import { CustomerServiceExample } from '@/components/examples/CustomerServiceExample';
import { ChatwootDebug } from '@/components/ChatwootDebug';
import { EnvCheck } from '@/components/EnvCheck';

export default function TestChatwootPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chatwoot Integration Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page is for testing the Chatwoot customer service integration. 
            You should see a floating customer service button in the bottom-right corner, 
            and you can also test the functionality using the controls below.
          </p>
        </div>

        <div className="space-y-8">
          {/* Environment Check */}
          <EnvCheck />
          
          {/* Debug Component */}
          <ChatwootDebug />
          
          {/* Test Controls */}
          <div className="flex justify-center">
            <CustomerServiceExample />
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <strong>1. Environment Variables:</strong>
                <p>Make sure you have set the following in your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:</p>
                <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-x-auto">
{`NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_website_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com`}
                </pre>
              </div>
              
              <div>
                <strong>2. Getting Your Website Token:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Log in to your Chatwoot admin panel</li>
                  <li>Go to Settings → Inboxes</li>
                  <li>Create or select a Website inbox</li>
                  <li>Copy the Website Token from the inbox settings</li>
                </ul>
              </div>

              <div>
                <strong>3. Testing:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The floating button should appear in the bottom-right corner</li>
                  <li>Click it to open/close the chat window</li>
                  <li>Use the controls above to test programmatic features</li>
                  <li>Check the browser console for any error messages</li>
                  <li>Use the debug panel above to identify any issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 