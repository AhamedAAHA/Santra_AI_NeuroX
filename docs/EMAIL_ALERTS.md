# Background email alerts

SANTRA can keep re-checking a monitor after "Check now" and email you when new
signals or changes appear. This page covers the setup, how to test it, and how
to read the failure messages.

## 1. Get a Resend API key

1. Create a free account at <https://resend.com> and confirm your email.
2. Open **API Keys → Create API Key**. Sending permission is enough.
3. Copy the key (`re_...`). It is only shown once.

## 2. Choose a sender address

| Option | `SANTRA_EMAIL_FROM` | Who can receive |
| --- | --- | --- |
| Quick test | `SANTRA Alerts <onboarding@resend.dev>` | Only the email that owns the Resend account |
| Production | `SANTRA Alerts <alerts@yourdomain.com>` | Anyone |

For the quick-test sender, also set:

```bash
SANTRA_EMAIL_SANDBOX_TO=you@your-resend-account.com
```

SANTRA will route alert emails to that inbox even when the signed-in user has a
different address. Without it, Resend rejects any other recipient.

For production, add your domain under **Domains → Add Domain** in Resend and
create the DNS records it lists (SPF, DKIM, and usually a return-path CNAME).
Verification typically completes within minutes.

## 3. Configure the app

Add to `.env.local`, then restart the dev server:

```bash
RESEND_API_KEY=re_your_key
SANTRA_EMAIL_FROM=SANTRA Alerts <onboarding@resend.dev>
SANTRA_EMAIL_SANDBOX_TO=you@your-resend-account.com

# Optional: minimum time between alert emails per monitor (default 30 minutes)
SANTRA_EMAIL_MIN_GAP_MS=1800000

# Required for background checks (any long random string)
CRON_SECRET=your-long-random-string
```

Alerts are sent to the email on your SANTRA account, so sign in with the
address you want the alerts to reach.

## 4. Turn the watch on

Run **Check now** on a monitor, open the report, and use the **Background email
watch** panel. Pick a check period (30 min – daily) and press **Start email
watch**. **Send test email** verifies delivery immediately without waiting for
a scheduled check.

## 5. Make the background checks run

The watch only fires when something calls `GET /api/cron/monitors` with
`Authorization: Bearer <CRON_SECRET>`.

Locally:

```bash
npm run cron:local            # polls every 5 minutes
npm run cron:local -- --once  # single pass
npm run cron:local -- --every 60
```

In production, point your host's scheduler at the same endpoint: Vercel Cron,
Netlify Scheduled Functions, Cloudflare Cron Triggers, or an external service
such as cron-job.org.

## 6. When an email is sent

An alert goes out when a check for a watched monitor finds matched signals or
detected changes. Two guards keep the volume sane:

- The first check after enabling the watch always emails once, so you can
  confirm the wiring works.
- After that, quiet checks are skipped, and repeat alerts respect
  `SANTRA_EMAIL_MIN_GAP_MS`.

Every send is written to the monitor timeline as a `notification_sent` event.

## Preview the redesigned alert email

While signed in locally:

1. Open [http://localhost:3001/dev/email-preview](http://localhost:3001/dev/email-preview)
2. Or fetch raw HTML: `GET /api/notifications/preview`
3. Plain text: `GET /api/notifications/preview?format=text`

The preview uses a sample Acme pricing report and does not send mail.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Panel shows "Email provider not configured" | `RESEND_API_KEY` or `SANTRA_EMAIL_FROM` is missing. Add it and restart the dev server. |
| Test email fails with 403 "testing emails" | You are on `onboarding@resend.dev`, which only delivers to the Resend account owner. Verify a domain or sign in to SANTRA with that address. |
| Test email fails with 422 about the recipient | Same sandbox restriction, reported by Resend during validation. |
| 401 from Resend | The API key is wrong, revoked, or lacks send permission. |
| No email despite watch enabled | Nothing is calling the cron endpoint. Run `npm run cron:local` or check your host's scheduler. |
| "Another alert was sent recently" | Throttled by `SANTRA_EMAIL_MIN_GAP_MS`. Lower it while testing. |
| Watch panel says MongoDB is required | Background watch state is persisted in MongoDB. Set `MONGODB_URI`. |

The email panel and the Check now toasts surface the exact provider error, and
the server logs each failure with the HTTP status, sender, and recipient.
