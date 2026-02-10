'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { IconUserPlus, IconShieldCheck, IconLock } from '@tabler/icons-react';
import { createAdmin } from '@/lib/firebase/collections';
import { registerUser } from '@/lib/firebase/auth';

export default function CreateAdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (value) => {
        setFormData((prev) => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Auth User
            // Note: This using Firebase client SDK will sign out the current user and sign in the new admin
            await registerUser(formData.email, formData.password);

            // 2. Create Firestore Document
            await createAdmin({
                name: formData.name,
                email: formData.email,
                role: formData.role,
            });

            toast.success('Admin account created successfully');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

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
                                    required
                                    className="h-10"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@foxonhub.com"
                                    required
                                    className="h-10"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
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
                                <div className="space-y-2">
                                    <Label htmlFor="password" title="At least 6 characters" className="text-sm font-medium">Set Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="h-10 pr-9"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <IconLock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
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
