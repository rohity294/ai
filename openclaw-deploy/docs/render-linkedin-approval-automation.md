# Render: WhatsApp -> Approval -> LinkedIn Posting

This guide turns your working WhatsApp chat setup into a controlled publishing workflow in one Render service.

## Architecture

1. WhatsApp is your operator interface.
2. OpenClaw generates draft content.
3. Human approval is required before publish.
4. LinkedIn posting happens only from approved drafts.
5. Draft state is stored in an external durable store when using no-disk hosting.
6. A minimal Node webhook worker runs inside the same container on localhost.

## Why External State On Render Free Tier

Render free services use ephemeral filesystems. If your process restarts, local draft state can be lost.

Use one of these managed stores:

- Upstash Redis
- Supabase Postgres
- Neon Postgres
- Airtable/Google Sheets (simple but less robust)

Current implementation in this repo supports Upstash Redis REST directly.

## Approval Workflow (Operator Commands)

Use these commands from WhatsApp:

- `draft <topic>`
- `revise <draft_id> <changes>`
- `approve <draft_id>`
- `reject <draft_id> <reason>`
- `post <draft_id>`
- `status <draft_id>`

## LinkedIn Integration Requirements

You need a LinkedIn app and user token capable of posting on behalf of your account.

Render environment variables:

- `LINKEDIN_ACCESS_TOKEN` (secret)
- `LINKEDIN_AUTHOR_URN` (for example: `urn:li:person:...`)
- `LINKEDIN_API_VERSION` (optional)
- `LINKEDIN_WEBHOOK_SHARED_SECRET` (secret)
- `LINKEDIN_WORKER_HOST=0.0.0.0`
- `OPENCLAW_INTERNAL_PORT=18080`
- `APPROVAL_REQUIRED=true`
- `REDIS_KEY_PREFIX=openclaw:linkedin`
- `UPSTASH_REDIS_REST_URL` (optional but recommended)
- `UPSTASH_REDIS_REST_TOKEN` (optional but recommended)
- `LINKEDIN_CLIENT_ID` (required for OAuth)
- `LINKEDIN_CLIENT_SECRET` (required for OAuth)
- `LINKEDIN_OAUTH_REDIRECT_URI=https://<your-render-domain>/v1/oauth/linkedin/callback`
- `LINKEDIN_OAUTH_SCOPES=openid profile email w_member_social`

OpenClaw/runtime environment variables:

- `OPENCLAW_GATEWAY_TOKEN` (secret)
- `OPENAI_API_KEY` (secret)
- `OPENCLAW_CONFIG_PATH=/app/config/openclaw.json`
- `OPENCLAW_GATEWAY_BIND=lan`

## State Model

Each draft must include:

- `draftId`
- `status` (`drafted`, `needs_approval`, `approved`, `rejected`, `posted`)
- `postText`
- `hashtags`
- `firstComment`
- `approval.approvedBy` and `approval.approvedAt`
- `linkedin.postUrn` after successful posting

Reference schema: `config/linkedin-draft.schema.json`

## Policy Enforcement

Use policy file `config/linkedin-approval-policy.md` as your OpenClaw system instruction so the agent never posts without approval.

Worker implementation file: `linkedin-worker/src/server.js`

Command webhook endpoint: `POST /v1/commands`

OAuth endpoints:

- `GET /v1/oauth/linkedin/start` (requires `x-webhook-token`)
- `GET /v1/oauth/linkedin/whatsapp-onboarding` (requires `x-webhook-token`)
- `GET /v1/oauth/linkedin/callback` (public callback from LinkedIn)
- `GET /v1/oauth/linkedin/status`
- `POST /v1/oauth/linkedin/refresh`

The whatsapp-onboarding endpoint returns a ready-to-send message with:

- LinkedIn connect URL
- callback and scope metadata
- suggested command sequence for draft, approve, and post

## Recommended Runtime Checks

Before allowing `post <draft_id>`, enforce:

1. Draft exists.
2. Draft status is `approved`.
3. Approval metadata exists.
4. Content length and hashtag count are valid.
5. LinkedIn token is present.

Use worker endpoint `POST /v1/drafts/:draftId/post` for the final publish action.

If you use command-style control via WhatsApp integration, call `POST /v1/commands` with:

- `text`: one of `draft`, `revise`, `approve`, `reject`, `post`, `status`
- `sender`: WhatsApp sender id used for allowlist checks

If any check fails, abort post and report failure in WhatsApp.

## Operational Notes

- In no-disk mode, any local fallback queue is temporary.
- Keep state in external storage to avoid losing approvals.
- Rotate LinkedIn access tokens before expiry.
- Add an allowlist of WhatsApp sender IDs who can approve/post.

## Go-Live Checklist

1. Persistent state backend connected.
2. Policy file loaded as system instruction.
3. Approval flow tested with one rejected and one approved draft.
4. Post command tested against a non-production LinkedIn account.
5. Logs confirm transitions: drafted -> approved -> posted.
