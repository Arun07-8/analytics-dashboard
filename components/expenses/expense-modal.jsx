"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createExpense, updateExpense } from "@/lib/firebase/collections"
import { useAuth } from "@/contexts/AuthContext"

const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z.string().min(1, "Date is required"),
    remarks: z.string().optional(),
})


export function ExpenseModal({ isOpen, onOpenChange, expense = null, admins = [] }) {
    const { user } = useAuth()
    const [loading, setLoading] = React.useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            remarks: "",
        },
    })

    React.useEffect(() => {
        if (expense) {
            form.reset({
                title: expense.title,
                amount: expense.amount.toString(),
                date: new Date(expense.date).toISOString().split('T')[0],
                remarks: expense.remarks || "",
            })
        } else {
            form.reset({
                title: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                remarks: "",
            })
        }
    }, [expense, form, isOpen])

    async function onSubmit(values) {
        if (!user) return;
        setLoading(true)
        try {
            if (expense) {
                await updateExpense(expense.id, values);
                toast.success("Expense updated successfully")
            } else {
                await createExpense({
                    ...values,
                    createdBy: user.uid
                });
                toast.success("Expense added successfully")
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
                    <DialogDescription>
                        {expense ? "Modify the details of your expense." : "Enter the details for the new expense."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., January Salary" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Add any extra notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Processing..." : expense ? "Update" : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
