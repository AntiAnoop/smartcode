import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

// We need a Service Role client to bypass RLS and update the task status
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const taskId = session.metadata?.taskId;

        if (taskId) {
            console.log(`Payment successful for task ${taskId}. Unlocking...`);

            // 1. Update task to paid
            const { error: taskError } = await supabaseAdmin
                .from('tasks')
                .update({ is_paid: true })
                .eq('id', taskId);

            if (taskError) {
                console.error('Error updating task status:', taskError);
                return new NextResponse('Database Error', { status: 500 });
            }

            // 2. Record payment
            const { error: paymentError } = await supabaseAdmin
                .from('payments')
                .insert({
                    task_id: taskId,
                    stripe_session_id: session.id,
                    status: session.payment_status,
                    amount_total: session.amount_total || 0,
                });

            if (paymentError) {
                console.error('Error recording payment:', paymentError);
                // We don't fail the webhook here because the main goal (unlocking) succeeded
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
