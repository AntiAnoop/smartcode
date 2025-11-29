'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Use latest or matching version
});

export async function createCheckoutSession(taskId: string) {
    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Smart Task Evaluation - Full Report',
                        description: 'Detailed code analysis, security audit, and refactoring.',
                    },
                    unit_amount: 500, // $5.00
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${origin}/task/${taskId}?success=true`,
        cancel_url: `${origin}/task/${taskId}?canceled=true`,
        metadata: {
            taskId: taskId,
        },
    });

    if (session.url) {
        redirect(session.url);
    }
}
