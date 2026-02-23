'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { IconUserPlus, IconShieldCheck, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function CreateAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user?.role?.trim().toLowerCase() !== 'admin') {
                router.push('/dashboard');
                toast.error("Access denied. Admins only.");
            }
        }
    }, [user, authLoading, router]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) error = 'Email is required';
            else if (!emailRegex.test(value)) error = 'Invalid email address';
        }
        if (name === 'password') {
            if (!value) error = 'Password is required';
            else if (value.length < 6) error = 'Password must be at least 6 characters';
        }
        if (name === 'confirmPassword') {
            if (!value) error = 'Confirm Password is required';
            else if (value !== formData.password) error = 'Passwords do not match';
        }
        if (name === 'name') {
            if (!value) error = 'Name is required';
        }
        return error;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const isFormValid = () => {
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);
        const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
        const nameError = validateField('name', formData.name);
        return !emailError && !passwordError && !nameError && !confirmPasswordError &&
            formData.email && formData.password && formData.name && formData.confirmPassword;
    };

    const handleRoleChange = (value) => {
        setFormData((prev) => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields on submit
        const nameError = validateField('name', formData.name);
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);
        const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);

        const newErrors = {
            name: nameError,
            email: emailError,
            password: passwordError,
            confirmPassword: confirmPasswordError
        };

        setErrors(newErrors);
        setTouched({
            name: true,
            email: true,
            password: true,
            confirmPassword: true
        });

        if (Object.values(newErrors).some(error => error)) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to create admin');
                return;
            }

            toast.success('Admin account created successfully');

            setFormData({
                name: '',
                email: '',
                role: 'admin',
                password: '',
                confirmPassword: '',
            });
            setTouched({});
            setErrors({});

            router.push('/createAdmin');
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };


    if (authLoading || !user || user?.role?.trim().toLowerCase() !== 'admin') {
        return null;
    }

    return (
        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md space-y-4">
                <div className="flex flex-col gap-1 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
                    <p className="text-muted-foreground text-sm">Add a new administrative user to give them access to the dashboard.</p>
                </div>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl">
                                <IconUserPlus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Create New Admin</CardTitle>
                                <CardDescription>
                                    Enter details to create a new user account
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Shibili"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`h-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@foxonhub.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`h-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium">Assign Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={handleRoleChange}
                                    >
                                        <SelectTrigger id="role" className="h-10">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">
                                                <div className="flex items-center gap-2">
                                                    <IconShieldCheck className="h-4 w-4 text-primary" />
                                                    <span>Admin</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" title="At least 6 characters" className="text-sm font-medium">Set Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                minLength={6}
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`h-10 pr-9 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                                            </div>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" title="Must match password" className="text-sm font-medium">Confirm Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`h-10 pr-9 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                                            </div>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4">
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    'Create Admin Account'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
