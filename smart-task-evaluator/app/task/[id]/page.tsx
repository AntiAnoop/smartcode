import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Unlock, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { createCheckoutSession } from '@/lib/stripe/actions';

export default async function TaskPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const { id } = params;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !task) {
        return <div className="container mx-auto py-10">Task not found or access denied.</div>;
    }

    if (task.user_id !== user.id) {
        return <div className="container mx-auto py-10">Access denied.</div>;
    }

    const isPaid = task.is_paid;
    const report = task.full_report_json;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Evaluation Result</h1>
                <span className={`px-4 py-2 rounded-full text-white font-bold ${task.ai_score >= 80 ? 'bg-green-500' : task.ai_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                    Score: {task.ai_score}/100
                </span>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">{task.ai_summary}</p>
                </CardContent>
            </Card>

            {isPaid ? (
                <div className="space-y-8">
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center text-green-600">
                                <Unlock className="mr-2" /> Full Analysis Unlocked
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 flex items-center"><CheckCircle className="mr-2 text-green-500" /> Strengths</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    {report?.analysis?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 flex items-center"><AlertTriangle className="mr-2 text-yellow-500" /> Weaknesses</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    {report?.analysis?.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 flex items-center"><ShieldAlert className="mr-2 text-red-500" /> Security Risks</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    {report?.analysis?.security_risks?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Refactored Code</h3>
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                                    <code>{report?.analysis?.refactored_code}</code>
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="border-blue-500 border-2 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-700">
                            <Lock className="mr-2" /> Unlock Full Report
                        </CardTitle>
                        <CardDescription>
                            Get detailed analysis, security checks, and refactored code.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <form action={createCheckoutSession.bind(null, task.id)}>
                            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                Unlock for $5.00
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
