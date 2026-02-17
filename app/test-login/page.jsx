'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TestLoginPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        'admin@develope.com',
        'develope123'
      );

      setResult(`✅ SUCCESS!
User UID: ${userCredential.user.uid}
Email: ${userCredential.user.email}
Project: ${auth.app.options.projectId}
`);
    } catch (error) {
      setResult(`❌ FAILED!
Error: ${error.code}
Message: ${error.message}
Project: ${auth.app.options.projectId}
Auth Domain: ${auth.app.options.authDomain}
`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Login Test</h1>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Testing with:</strong></p>
        <p>Email: admin@develope.com</p>
        <p>Password: develope123</p>
      </div>

      <button
        onClick={testLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-black text-white rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="mt-8 p-4 border rounded">
        <h2 className="font-bold mb-2">Firebase Config:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(auth.app.options, null, 2)}
        </pre>
      </div>
    </div>
  );
}
