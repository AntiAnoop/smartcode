'use client';

import { useState } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { submitTaskAction } from '@/lib/supabase/actions'; // We will create this Server Action next
import { useRouter } from 'next/navigation';

const formSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters." }),
    taskDescription: z.string().min(20, { message: "Task description must be detailed (at least 20 characters)." }),
    codeSnippet: z.string().min(50, { message: "Code snippet must be at least 50 characters." }),
});

export default function SubmitTaskForm() {
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            taskDescription: "",
            codeSnippet: "",
        },
    });

    const isLoading = form.formState.isSubmitting;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setStatusMessage(null);

        try {
            // Call the Server Action
            const result = await submitTaskAction(values);

            if (result.error) {
                setStatusMessage({ type: 'error', message: result.error });
            } else if (result.taskId) {
                setStatusMessage({ type: 'success', message: 'Task submitted successfully. Running AI evaluation...' });
                form.reset();
                // Redirect to the newly created task's evaluation page
                router.push(`/task/${result.taskId}`);
            }
        } catch (e) {
            console.error(e);
            setStatusMessage({ type: 'error', message: 'An unexpected error occurred during submission.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., React Todo List with State Management" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="taskDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Task Description (What were you asked to build?)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe the objective, constraints, and technologies used..."
                                        rows={5}
                                        {...field}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="codeSnippet"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Code Snippet (The full code for evaluation)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Paste your code here..."
                                        rows={15}
                                        {...field}
                                        disabled={isLoading}
                                        className="font-mono text-sm"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Zap className="mr-2 h-5 w-5" />
                        )}
                        Run AI Evaluation (Free Basic Feedback)
                    </Button>
                    {statusMessage && (
                        <p className={`text-sm font-medium ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {statusMessage.message}
                        </p>
                    )}
                </CardFooter>
            </form>
        </Form>
    );
}