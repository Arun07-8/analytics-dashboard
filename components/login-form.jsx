'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";

export function LoginForm({
  className,
  ...props
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Normalize email (lowercase and trimmed) as requested for case-insensitivity
      const normalizedEmail = email.trim().toLowerCase();

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // Get Firebase ID token for JWT-like functionality
      const token = await user.getIdToken();

      // Store token in cookie (httpOnly would be better in production)
      document.cookie = `authToken=${token}; path=/; max-age=3600`;
      document.cookie = `userId=${user.uid}; path=/; max-age=3600`;

      toast.success('✅ Login successful!');

      // Clear form
      setEmail('');
      setPassword('');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err) {
      let errorMessage = 'Login failed';

      // Map Firebase codes to user-friendly messages
      if (err && typeof err === 'object') {
        const code = err.code || '';
        if (code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password.';
        } else if (code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled.';
        } else if (code === 'auth/too-many-requests') {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (code === 'auth/invalid-credential') {
          errorMessage = 'Incorrect email or password.';
        } else {
          errorMessage = err.message || 'Authentication failed';
        }
      }

      // 🛡️ Show ONLY toast, NO console.error to avoid Next.js dev box
      toast.error('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }


  };

  return (
    <form onSubmit={handleLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>


        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors({ ...validationErrors, email: '' });
              }
            }}
            disabled={loading}
            className={validationErrors.email ? 'border-destructive' : ''}
          />
          {validationErrors.email && (
            <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
          )}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" >Password</FieldLabel>
            {/* <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a> */}
          </div>
          <div className="relative">
            <Input
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors({ ...validationErrors, password: '' });
                }
              }}
              disabled={loading}
              className={cn("pr-10", validationErrors.password ? 'border-destructive' : '')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Login'
            )}
          </Button>
        </Field>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
