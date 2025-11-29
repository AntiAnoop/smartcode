import { SupabaseClient } from '@supabase/supabase-js';

interface EvaluationParams {
    taskId: string;
    taskDescription: string;
    codeSnippet: string;
    supabase: SupabaseClient;
}

export async function runEvaluation({ taskId, taskDescription, codeSnippet, supabase }: EvaluationParams) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set');
        return;
    }

    try {
        const prompt = `
        You are a Senior Code Reviewer. Analyze the provided code based on the user's description.
        You MUST return a valid JSON object strictly adhering to the specified schema.
        
        Task Description: ${taskDescription}
        
        Code Snippet:
        ${codeSnippet}
        
        JSON Schema:
        {
          "score": number, // 0-100
          "summary": string, // 2-3 sentences max (Free tier)
          "analysis": {
            "strengths": string[], // Bullet points
            "weaknesses": string[], // Bullet points
            "security_risks": string[], // Critical issues
            "refactored_code": string // Complete rewrite
          }
        }
        
        Return ONLY the JSON. No markdown formatting.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text generated from Gemini API');
        }

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse Gemini response as JSON:', text);
            // Fallback or partial update
            throw new Error('Invalid JSON response from AI');
        }

        console.log(`AI Evaluation for task ${taskId} completed.`);

        // Update Supabase with the evaluation result
        const { error } = await supabase
            .from('tasks')
            .update({
                ai_score: jsonResponse.score,
                ai_summary: jsonResponse.summary,
                full_report_json: jsonResponse, // Store full JSON
                // We don't have a status column in the new schema, but we can assume presence of ai_score means done.
                // Or we could add a status column if needed, but spec didn't explicitly ask for it in the table definition,
                // though it mentioned 'status' in payments.
                // Let's stick to the schema: ai_score, ai_summary, full_report_json.
            })
            .eq('id', taskId);

        if (error) {
            console.error('Error updating task with AI evaluation:', error);
        }

    } catch (error) {
        console.error('Error running AI evaluation:', error);
        // We might want to flag the task as failed, but we don't have a status column.
        // Maybe set ai_summary to "Evaluation Failed".
        try {
            await supabase
                .from('tasks')
                .update({ ai_summary: 'AI Evaluation Failed. Please try again.' })
                .eq('id', taskId);
        } catch (updateError) {
            console.error('Failed to update task failure status:', updateError);
        }
    }
}
