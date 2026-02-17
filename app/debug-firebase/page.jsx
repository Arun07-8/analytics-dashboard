'use client';

import { useEffect, useState } from 'react';

export default function DebugFirebasePage() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    setConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Configuration Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-sm">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
      <div className="mt-4">
        <p className="font-semibold">Expected Project ID:</p>
        <p className="text-green-600">foxonhub-dashboard</p>
      </div>
    </div>
  );
}
