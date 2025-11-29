'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runEvaluation } from '@/lib/ai/gemini';
import { z } from 'zod';

// Define the validation schema (matching the client-side form)
const formSchema = z.object({
    title: z.string().min(5),
    taskDescription: z.string().min(20),
    codeSnippet: z.string().min(50),
});

type TaskInput = z.infer<typeof formSchema>;

// Response structure for the action
interface ActionResponse {
    error?: string;
    taskId?: string;
}

/**
 * Handles the secure submission of a new coding task.
 */
export async function submitTaskAction(data: TaskInput): Promise<ActionResponse> {
    // 1. Validate input
    const validation = formSchema.safeParse(data);
    if (!validation.success) {
        return { error: 'Invalid input data.' };
    }

    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    // 2. Get the authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Ideally we should throw or return error, but redirecting here might not work if called from client component expecting JSON.
        // Better to return error.
        return { error: 'Unauthorized. Please log in.' };
    }

    // 3. Insert the raw task data into the 'tasks' table
    const { data: insertedTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            description: data.taskDescription, // Mapped from taskDescription
            code_snippet: data.codeSnippet,   // Mapped from codeSnippet
            // title is not in the schema v1.0, so we ignore it or could append to description
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Supabase Insert Error:', insertError.message);
        return { error: 'Database error: Could not submit task.' };
    }

    const taskId = insertedTask.id;

    // 4. Asynchronously trigger the AI evaluation
    console.log(`Task ${taskId} submitted. Triggering AI evaluation...`);

    // We await this to ensure it runs before the action returns.
    // In a real production app, this should be offloaded to a background worker (e.g. Inngest/Trigger.dev).
    await runEvaluation({
        taskId: taskId,
        taskDescription: data.taskDescription,
        codeSnippet: data.codeSnippet,
        supabase: supabase,
    });

    return { taskId: taskId };
}