import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SubmitTaskForm from './submit-task-form';

export const metadata = {
    title: 'Submit Task for Evaluation',
    description: 'Provide your task description and code snippet to get AI feedback.',
};

export default function SubmitTaskPage() {
    return (
        <div className="flex justify-center py-8">
            <Card className="w-full max-w-3xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                        New Task Submission
                    </CardTitle>
                    <CardDescription>
                        Paste your task description and the corresponding code below. The AI will provide an immediate score and preliminary feedback.
                    </CardDescription>
                </CardHeader>
                <SubmitTaskForm />
            </Card>
        </div>
    );
}