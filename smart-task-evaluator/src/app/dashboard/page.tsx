import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in.</div>;
    }

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Tasks</h1>
                <Link href="/submit">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Task
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tasks?.map((task) => (
                    <Link href={`/task/${task.id}`} key={task.id}>
                        <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="truncate pr-2">Task {task.id.slice(0, 8)}</span>
                                    {task.is_paid ? (
                                        <CheckCircle className="text-green-500 h-5 w-5" />
                                    ) : (
                                        <Clock className="text-yellow-500 h-5 w-5" />
                                    )}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {task.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Score: {task.ai_score ?? 'N/A'}</span>
                                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {tasks?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No tasks found. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}