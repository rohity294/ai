# OpenClaw Deploy (Java + Docker)

This folder contains a custom Docker image setup to run OpenClaw on PaaS with Java as the launcher runtime. The deployment flow below is tailored for Render.

## What Is Included

- `Dockerfile`: Multi-stage image that builds a Java launcher and installs OpenClaw CLI globally with Node.js.
- `src/main/java/com/openclaw/deploy/OpenClawLauncher.java`: Java entrypoint that starts `openclaw gateway run`.
- `config/openclaw.json`: Schema-valid OpenClaw config baseline for the current CLI.
- `docker/healthcheck.sh`: Container health check script.
- `sevalla.example.yaml`: Starter Sevalla deployment template.

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

## Deploy To Render

1. Push this branch to GitHub.
2. In Render, create a new Web Service from the repository.
3. Choose Docker deployment.
4. Set root directory to `openclaw-deploy`.
5. Render will use `openclaw-deploy/Dockerfile` from that root directory.
6. Add environment variables in Render:
   - `OPENCLAW_GATEWAY_TOKEN` (required; set as a secret)
   - `OPENCLAW_CONFIG_PATH=/app/config/openclaw.json` (optional; already defaulted in image)
   - `PORT` (Render injects this automatically)
7. Add a persistent disk mounted at `/data/.openclaw`.
8. Deploy.

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
