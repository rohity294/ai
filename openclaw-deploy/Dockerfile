# Build Java launcher
FROM maven:3.9.8-eclipse-temurin-21 AS java-build
WORKDIR /build
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

# Runtime image with Java + Node + OpenClaw CLI
FROM eclipse-temurin:21-jre-jammy

ARG NODE_MAJOR=24
ARG OPENCLAW_VERSION=2026.7.1-2
ENV APP_HOME=/app
ENV OPENCLAW_HOME=/data/.openclaw
ENV OPENCLAW_CONFIG_PATH=/app/config/openclaw.json
ENV NODE_ENV=production

WORKDIR ${APP_HOME}

# Install Node.js and OpenClaw CLI
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g openclaw@${OPENCLAW_VERSION} \
    && command -v openclaw \
    && openclaw --help >/dev/null \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove curl gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copy launcher and app assets
COPY --from=java-build /build/target/openclaw-launcher-1.0.0.jar /app/openclaw-launcher.jar
COPY config/openclaw.json /app/config/openclaw.json
COPY linkedin-worker /app/linkedin-worker
COPY docker/healthcheck.sh /app/docker/healthcheck.sh
COPY docker/start-services.sh /app/docker/start-services.sh
RUN chmod +x /app/docker/healthcheck.sh /app/docker/start-services.sh

# Persist OpenClaw state (sessions/credentials)
VOLUME ["/data/.openclaw"]

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["/app/docker/healthcheck.sh"]

ENTRYPOINT ["/app/docker/start-services.sh"]
