"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { IconCalendar } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { createExpense, updateExpense } from "@/lib/firebase/collections"
import { useAuth } from "@/contexts/AuthContext"

const toLocalDateStr = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

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
            date: toLocalDateStr(),
            remarks: "",
        },
    })

    React.useEffect(() => {
        if (expense) {
            form.reset({
                title: expense.title,
                amount: expense.amount.toString(),
                date: toLocalDateStr(new Date(expense.date)),
                remarks: expense.remarks || "",
            })
        } else {
            form.reset({
                title: "",
                amount: "",
                date: toLocalDateStr(),
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
                                render={({ field }) => {
                                    const selectedDate = field.value ? new Date(field.value + 'T00:00:00') : undefined;
                                    return (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-semibold text-xs h-9 px-3 border-input bg-background hover:bg-muted/50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <IconCalendar className="mr-2 h-3.5 w-3.5 opacity-60" />
                                                            {selectedDate ? format(selectedDate, "dd - M - yyyy") : "Select date"}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                const y = date.getFullYear();
                                                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                                                const d = String(date.getDate()).padStart(2, '0');
                                                                field.onChange(`${y}-${m}-${d}`);
                                                            }
                                                        }}
                                                        disabled={(date) => date > new Date()}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
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
