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
        <div className="flex flex-1 items-center justify-center p-4 md:p-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-full max-w-lg space-y-6">
                <div className="space-y-2 text-center flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                            Admin Panel
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Admin Management
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                        Add a new administrative user to grant them access to the dashboard.
                    </p>
                </div>

                <Card className="relative overflow-hidden group border-border/40 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 bg-card">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                            <div className="bg-primary/10 p-3 rounded-xl ring-1 ring-inset ring-primary/20 flex-shrink-0">
                                <IconUserPlus className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground">Create New Admin</CardTitle>
                                <CardDescription className="text-xs font-medium text-muted-foreground">
                                    Enter details to register a new system administrator
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`h-10 text-sm font-medium bg-background border-border/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all shadow-sm ${errors.name ? 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive' : 'hover:border-primary/30'}`}
                                />
                                {errors.name && (
                                    <p className="text-xs font-medium text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`h-10 text-sm font-medium bg-background border-border/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all shadow-sm ${errors.email ? 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive' : 'hover:border-primary/30'}`}
                                />
                                {errors.email && (
                                    <p className="text-xs font-medium text-destructive mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Assign Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={handleRoleChange}
                                    >
                                        <SelectTrigger id="role" className="h-10 text-sm font-medium bg-background border-border/60 rounded-lg hover:border-primary/30 focus:ring-1 focus:ring-primary/30 transition-all shadow-sm">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/40 shadow-lg">
                                            <SelectItem value="admin" className="text-xs font-medium focus:bg-primary/5 focus:text-primary rounded-md cursor-pointer transition-colors py-2">
                                                <div className="flex items-center gap-2">
                                                    <IconShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    <span className="font-bold">Admin</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="staff" className="text-xs font-medium focus:bg-primary/5 focus:text-primary rounded-md cursor-pointer transition-colors py-2">Staff Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" title="At least 6 characters" className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                            Set Password
                                            <span className="text-[10px] font-medium opacity-50 lowercase tracking-normal bg-muted px-1.5 py-0.5 rounded">Min 6 chars</span>
                                        </Label>
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
                                                className={`h-10 pr-9 text-sm font-medium bg-background border-border/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all shadow-sm ${errors.password ? 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive' : 'hover:border-primary/30'}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/50 hover:text-primary transition-colors p-1"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                                            </div>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs font-medium text-destructive mt-1">{errors.password}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" title="Must match password" className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`h-10 pr-9 text-sm font-medium bg-background border-border/60 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all shadow-sm ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive' : 'hover:border-primary/30'}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/50 hover:text-primary transition-colors p-1"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                                            </div>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-xs font-medium text-destructive mt-1">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 pb-6 px-6">
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-bold tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] rounded-xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        <span>Securing Credentials...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Create Administrator</span>
                                        <IconShieldCheck className="h-4 w-4 opacity-70" />
                                    </div>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
