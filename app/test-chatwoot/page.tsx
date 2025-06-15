export default function TestChatwootPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Chatwoot Integration Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Check the browser console for Chatwoot loading messages</li>
            <li>Look for the blue chat button in the bottom-right corner</li>
            <li>Click the chat button to open the Chatwoot widget</li>
            <li>Try sending a test message</li>
            <li>Check for any 429 errors in the Network tab</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Expected Behavior
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>SDK should load without 429 errors</li>
            <li>Widget should open when clicking the chat button</li>
            <li>No duplicate API calls should be made</li>
            <li>Page refreshes should not cause 429 errors</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Debug Information
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Base URL:</strong> {process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'Not set'}</p>
            <p><strong>Website Token:</strong> {process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN ? 'Set' : 'Not set'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 