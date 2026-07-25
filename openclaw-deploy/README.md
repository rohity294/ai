# OpenClaw Deploy (Java + Docker)

This folder contains a custom Docker image setup to run OpenClaw on PaaS with Java as the launcher runtime. The deployment flow below is tailored for Render.

## What Is Included

- `Dockerfile`: Multi-stage image that builds a Java launcher and installs OpenClaw CLI globally with Node.js.
- `src/main/java/com/openclaw/deploy/OpenClawLauncher.java`: Java entrypoint that starts `openclaw gateway run`.
- `linkedin-worker/src/server.js`: Minimal Node webhook worker for drafts, approvals, and LinkedIn posting.
- `docker/start-services.sh`: Starts both OpenClaw and the worker in one container for single-service Render deploys.
- `config/openclaw.json`: Schema-valid OpenClaw config baseline for the current CLI.
- `config/linkedin-approval-policy.md`: Human-in-the-loop policy for approval-gated LinkedIn publishing.
- `config/linkedin-draft.schema.json`: Draft object contract for status tracking and validation.
- `docker/healthcheck.sh`: Container health check script.
- `sevalla.example.yaml`: Starter Sevalla deployment template.
- `docs/render-linkedin-approval-automation.md`: Render runbook for WhatsApp -> approve -> post flow.
- `.env-linkedin-automation.example`: Environment variable template for approval and LinkedIn posting.

## Build locally

```bash
docker build -t openclaw-java:latest .
```

## Run locally

```bash
# Edit .env-local first with your real token and API key.

docker run --rm -it \
  --env-file .env-local \
  -p 8080:8080 \
  -v openclaw_state:/data/.openclaw \
  openclaw-java:latest
```

## Deploy To Render (Single Service)

1. Push this branch to GitHub.
2. In Render, create a new Web Service from the repository.
3. Choose Docker deployment.
4. Set root directory to `openclaw-deploy`.
5. Render will use `openclaw-deploy/Dockerfile` from that root directory.
6. Add environment variables in Render:
  - `OPENCLAW_GATEWAY_TOKEN` (required; secret)
  - `OPENAI_API_KEY` (required; secret)
  - `OPENCLAW_CONFIG_PATH=/app/config/openclaw.json`
  - `OPENCLAW_INTERNAL_PORT=18080`
  - `LINKEDIN_WEBHOOK_SHARED_SECRET` (required; secret)
  - `APPROVAL_REQUIRED=true`
  - `APPROVER_WHATSAPP_ALLOWLIST=15551234567,15557654321`
  - `LINKEDIN_CLIENT_ID` (required for OAuth)
  - `LINKEDIN_CLIENT_SECRET` (required for OAuth; secret)
  - `LINKEDIN_OAUTH_REDIRECT_URI=https://<your-render-domain>/v1/oauth/linkedin/callback`
  - `LINKEDIN_OAUTH_SCOPES=openid profile email w_member_social`
  - `UPSTASH_REDIS_REST_URL` (recommended for durable state)
  - `UPSTASH_REDIS_REST_TOKEN` (recommended; secret)
  - `REDIS_KEY_PREFIX=openclaw:linkedin`
  - `PORT` (Render injects this automatically)
7. Add a persistent disk mounted at `/data/.openclaw`.
8. Deploy.

The container starts two internal processes:

- LinkedIn worker on `PORT` (public)
- OpenClaw gateway on internal `OPENCLAW_INTERNAL_PORT` (default `18080`)

The worker reverse-proxies non-worker routes to OpenClaw so your existing gateway traffic continues to work.

No second Render service is required.

Important for remote production use:

- The worker supports Redis persistence via Upstash REST (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- If Redis vars are not set, it falls back to in-memory storage.
- In-memory mode loses draft state on container restart.

## LinkedIn OAuth (No Manual Token Copy/Paste)

Set these env vars in Render:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_OAUTH_REDIRECT_URI=https://<your-render-domain>/v1/oauth/linkedin/callback`
- `LINKEDIN_OAUTH_SCOPES=openid profile email w_member_social`
- `LINKEDIN_OAUTH_AUTO_REFRESH=true`

OAuth flow:

1. Call `GET /v1/oauth/linkedin/start` with `x-webhook-token` header.
2. Open returned `connectUrl` in browser and approve LinkedIn consent.
3. LinkedIn redirects to `/v1/oauth/linkedin/callback`.
4. Worker exchanges code, stores token in Redis (or memory), and uses it for posting.
5. Worker auto-refreshes token on post when refresh token is available.

## Codespaces Smoke Test (Validated)

Run the same image from Codespaces before deploying:

```bash
docker run --rm --name openclaw-render-test \
  --env-file .env-local \
  -p 8080:8080 \
  rohity294/openclaw-java:latest
```

In another terminal:

```bash
curl -sS http://127.0.0.1:8080/health
```

Expected response:

```json
{"ok":true,"status":"live"}
```

## Test From WhatsApp

After the container is running and healthy, connect a WhatsApp account and verify end-to-end messaging.

### Local Docker / Codespaces

1. Start the container with persistent storage:

```bash
docker volume create openclaw_state

docker run -d --name openclaw-whatsapp \
  --env-file .env-local \
  -p 8080:8080 \
  -v openclaw_state:/data/.openclaw \
  rohity294/openclaw-java:renderfix-20260725
```

2. Run the OpenClaw setup wizard in the container:

```bash
docker exec -it openclaw-whatsapp openclaw configure
```

3. In the wizard:
- Configure model credentials.
- Add the WhatsApp channel.
- Scan the QR code from your phone.

4. Confirm channel status:

```bash
docker exec -it openclaw-whatsapp openclaw channels status
```

5. Send a test WhatsApp message to the paired account:
- Send: hello
- Expect: a reply from the agent/gateway flow.

6. Watch runtime logs while testing:

```bash
docker logs -f openclaw-whatsapp
```

### Render

1. Open the service Shell in Render.
2. Run setup:

```bash
openclaw configure
```

3. Add/pair WhatsApp in the wizard (QR scan).
4. Validate status:

```bash
openclaw channels status
```

5. Send hello from WhatsApp and monitor Render logs.

If WhatsApp disconnects after restart, verify persistent disk is mounted at /data/.openclaw.

## Notes

- OpenClaw WhatsApp onboarding may require one-time QR pairing.
- Persisting `/data/.openclaw` is important for credentials/session continuity across restarts.
- If your OpenClaw version uses a different config schema, run `openclaw onboard` once and replace `config/openclaw.json` with the generated structure.

## Approval-and-Post Automation (LinkedIn)

Your WhatsApp chat is already working. To convert it into a real approval gate before LinkedIn posting:

1. Load `config/linkedin-approval-policy.md` as your agent system instruction.
2. Ensure draft objects follow `config/linkedin-draft.schema.json`.
3. Store draft state in an external datastore if running without persistent disk.
4. Wire `approve <draft_id>` and `post <draft_id>` commands to the internal worker endpoints.
5. Enforce status checks so only approved drafts can be posted.

### Internal Worker Endpoints

All worker calls require header `x-webhook-token: <LINKEDIN_WEBHOOK_SHARED_SECRET>`.

- `GET /worker/health`
- `POST /v1/drafts`
- `GET /v1/drafts/:draftId`
- `POST /v1/drafts/:draftId/approve`
- `POST /v1/drafts/:draftId/reject`
- `POST /v1/drafts/:draftId/post`
- `POST /v1/commands` (WhatsApp-style command parser)
- `GET /v1/oauth/linkedin/start`
- `GET /v1/oauth/linkedin/whatsapp-onboarding`
- `GET /v1/oauth/linkedin/callback` (public callback, no webhook header)
- `GET /v1/oauth/linkedin/status`
- `POST /v1/oauth/linkedin/refresh`

WhatsApp onboarding helper:

1. Call GET /v1/oauth/linkedin/whatsapp-onboarding with x-webhook-token.
2. Copy the returned message text and send it in WhatsApp.
3. Operator taps connectUrl, authorizes LinkedIn, then follows nextCommands.

Command endpoint payload format:

- `text`: command text, examples: `draft ...`, `approve DRAFT-...`, `post DRAFT-...`
- `sender`: sender identifier used for allowlist checks

Example flow from a shell in the running container:

```bash
TOKEN="$LINKEDIN_WEBHOOK_SHARED_SECRET"
BASE="http://127.0.0.1:3010"

# 1) Create draft
curl -sS -X POST "$BASE/v1/drafts" \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: $TOKEN" \
  -d '{"postText":"Shipping our new AI workflow today.","hashtags":["#AI","#BuildInPublic"]}'

# 2) Approve draft
curl -sS -X POST "$BASE/v1/drafts/<DRAFT_ID>/approve" \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: $TOKEN" \
  -d '{"approver":"15551234567"}'

# 3) Publish (fails unless approved)
curl -sS -X POST "$BASE/v1/drafts/<DRAFT_ID>/post" \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: $TOKEN" \
  -d '{}'

# 4) Command endpoint example (same behavior)
curl -sS -X POST "$BASE/v1/commands" \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: $TOKEN" \
  -d '{"text":"approve <DRAFT_ID>","sender":"15551234567"}'
```

See full implementation guide in `docs/render-linkedin-approval-automation.md`.
