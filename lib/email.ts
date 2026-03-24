import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'CogniLift <noreply@cognilift.in>';

export async function sendWelcomeEmail(to: string, name: string, trialDays: number) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Welcome to CogniLift!',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e293b;">Welcome to CogniLift, ${name || 'Student'}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Your account has been created and your <strong>${trialDays}-day free trial</strong> has started.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Explore all CBSE learning resources during your trial period. Subscribe anytime to continue after your trial ends.
          </p>
          <div style="margin: 24px 0;">
            <a href="https://cognilift.in" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Start Learning
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">— Team CogniLift</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

export async function sendSubscriptionConfirmedEmail(
  to: string,
  name: string,
  amountINR: number,
  endsAt: Date,
) {
  try {
    const endDate = endsAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Subscription Confirmed — CogniLift',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e293b;">Payment Successful!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name || 'Student'}, your subscription is now active.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>Amount Paid:</strong> Rs ${amountINR}<br/>
              <strong>Valid Until:</strong> ${endDate}
            </p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            You now have full access to all CBSE resources. Happy learning!
          </p>
          <div style="margin: 24px 0;">
            <a href="https://cognilift.in" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Go to CogniLift
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">— Team CogniLift</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send subscription email:', err);
  }
}

export async function sendCommissionEarnedEmail(
  to: string,
  advisorName: string,
  studentName: string,
  commissionINR: number,
  subscriptionAmountINR: number,
) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'New Referral Commission Earned — CogniLift',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e293b;">You earned a commission!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${advisorName || 'Advisor'}, a student you referred has subscribed.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>Student:</strong> ${studentName}<br/>
              <strong>Subscription Amount:</strong> Rs ${subscriptionAmountINR}<br/>
              <strong>Your Commission:</strong> Rs ${commissionINR}
            </p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            This commission is pending and will be paid out by the admin. You can check your dashboard for details.
          </p>
          <div style="margin: 24px 0;">
            <a href="https://cognilift.in/advisor/dashboard" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Dashboard
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">— Team CogniLift</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send commission email:', err);
  }
}

export async function sendPayoutProcessedEmail(
  to: string,
  advisorName: string,
  amountINR: number,
) {
  try {
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Payout Processed — CogniLift',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e293b;">Payout Processed!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${advisorName || 'Advisor'}, your commission payout has been processed.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>Amount:</strong> Rs ${amountINR}<br/>
              <strong>Date:</strong> ${date}
            </p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            The amount will be credited to your registered bank account. Check your advisor dashboard for details.
          </p>
          <div style="margin: 24px 0;">
            <a href="https://cognilift.in/advisor/dashboard" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Dashboard
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">— Team CogniLift</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send payout email:', err);
  }
}
