'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

export default function CreateAdmin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const adminData = {
    name: 'admin',
    email: 'shibilshibil8111@gmail.com',
    password: 'shibil07', // Default password
  };

  const handleCreateAdmin = async () => {
    setLoading(true);

    try {
      // Check if admin already exists
      const q = query(collection(db, 'admins'), where('email', '==', adminData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error('Admin with this email already exists!');
        setLoading(false);
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );
      const userId = userCredential.user.uid;

      // Create admin document in Firestore
      const docRef = await addDoc(collection(db, 'admins'), {
        name: adminData.name,
        email: adminData.email,
        role: 'admin',
        userId: userId,
        attendance: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success('✅ Admin created successfully!', {
        description: `Document ID: ${docRef.id}`,
      });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-semibold">Admin Created!</h2>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create First Admin</CardTitle>
          <CardDescription>Initialize your FoxonHub admin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{adminData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{adminData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">{adminData.password}</p>
            </div>
          </div>

          <Button onClick={handleCreateAdmin} className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Admin'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ⚠️ You will be redirected to login page after creation.
            <br />
            Change the password after first login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
