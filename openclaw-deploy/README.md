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
docker run --rm -it \
  -e PORT=8080 \
  -e OPENCLAW_GATEWAY_TOKEN=your_secure_token \
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
  -e PORT=8080 \
  -e OPENCLAW_GATEWAY_TOKEN=render-test-token \
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

## Notes

- OpenClaw WhatsApp onboarding may require one-time QR pairing.
- Persisting `/data/.openclaw` is important for credentials/session continuity across restarts.
- If your OpenClaw version uses a different config schema, run `openclaw onboard` once and replace `config/openclaw.json` with the generated structure.
