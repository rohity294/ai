import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

const host = process.env.LINKEDIN_WORKER_HOST || "127.0.0.1";
const port = parseInt(process.env.LINKEDIN_WORKER_PORT || "3010", 10);
const webhookToken = process.env.LINKEDIN_WEBHOOK_SHARED_SECRET || "";
const approvalRequired = parseBool(process.env.APPROVAL_REQUIRED, true);
const approverAllowlist = parseAllowlist(process.env.APPROVER_WHATSAPP_ALLOWLIST || "");
const linkedinAccessToken = process.env.LINKEDIN_ACCESS_TOKEN || "";
const linkedinAuthorUrn = process.env.LINKEDIN_AUTHOR_URN || "";
const linkedinApiBase = process.env.LINKEDIN_API_BASE_URL || "https://api.linkedin.com";
const linkedinApiVersion = process.env.LINKEDIN_API_VERSION || "";
const linkedinOauthBase = process.env.LINKEDIN_OAUTH_BASE_URL || "https://www.linkedin.com";
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID || "";
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET || "";
const linkedinOauthRedirectUri = process.env.LINKEDIN_OAUTH_REDIRECT_URI || "";
const linkedinOauthScopes = process.env.LINKEDIN_OAUTH_SCOPES || "openid profile email w_member_social";
const linkedinOauthStateTtlSec = parseInt(process.env.LINKEDIN_OAUTH_STATE_TTL_SEC || "600", 10);
const linkedinOauthAutoRefresh = parseBool(process.env.LINKEDIN_OAUTH_AUTO_REFRESH, true);
const openclawUpstreamUrl = process.env.OPENCLAW_UPSTREAM_URL || "";
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redisKeyPrefix = process.env.REDIS_KEY_PREFIX || "openclaw:linkedin";

const drafts = new Map();
const useRedis = Boolean(redisUrl && redisToken);
const oauthStateCache = new Map();
let oauthTokenCache = null;

const server = http.createServer(async (req, res) => {
  try {
    const route = matchRoute(req.method, req.url || "");

    if (!route) {
      if (openclawUpstreamUrl) {
        return await proxyToOpenClaw(req, res);
      }
      return sendJson(res, 404, { error: "not_found" });
    }

    if (!isPublicRoute(route.name) && !isAuthorized(req)) {
      return sendJson(res, 401, { error: "unauthorized" });
    }

    if (route.name === "health") {
      return sendJson(res, 200, { ok: true, service: "linkedin-worker" });
    }

    if (route.name === "createDraft") {
      const body = await readJson(req);
      return await handleCreateDraft(body, res);
    }

    if (route.name === "getDraft") {
      return await handleGetDraft(route.params.draftId, res);
    }

    if (route.name === "approveDraft") {
      const body = await readJson(req);
      return await handleApproveDraft(route.params.draftId, body, res);
    }

    if (route.name === "rejectDraft") {
      const body = await readJson(req);
      return await handleRejectDraft(route.params.draftId, body, res);
    }

    if (route.name === "postDraft") {
      const body = await readJson(req);
      return await handlePostDraft(route.params.draftId, body, res);
    }

    if (route.name === "command") {
      const body = await readJson(req);
      return await handleCommand(body, res);
    }

    if (route.name === "oauthStart") {
      return await handleOauthStart(res);
    }

    if (route.name === "whatsappOnboarding") {
      return await handleWhatsAppOnboarding(res);
    }

    if (route.name === "oauthCallback") {
      const requestUrl = new URL(req.url || "", "http://localhost");
      return await handleOauthCallback(requestUrl, res);
    }

    if (route.name === "oauthStatus") {
      return await handleOauthStatus(res);
    }

    if (route.name === "oauthRefresh") {
      return await handleOauthRefresh(res);
    }

    return sendJson(res, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return sendJson(res, 500, { error: "internal_error", message });
  }
});

server.listen(port, host, () => {
  console.log(`LinkedIn worker listening on http://${host}:${port}`);
  console.log(`LinkedIn worker storage backend: ${useRedis ? "upstash-redis" : "in-memory"}`);
  if (openclawUpstreamUrl) {
    console.log(`OpenClaw reverse proxy enabled -> ${openclawUpstreamUrl}`);
  }
});

function isPublicRoute(routeName) {
  return routeName === "oauthCallback" || routeName === "health";
}

function isAuthorized(req) {
  if (!webhookToken) {
    return true;
  }
  const provided = req.headers["x-webhook-token"];
  return typeof provided === "string" && provided === webhookToken;
}

function matchRoute(method, urlString) {
  const url = new URL(urlString, "http://localhost");
  const path = url.pathname;

  if (method === "POST" && path === "/v1/drafts") {
    return { name: "createDraft", params: {} };
  }
  if (method === "POST" && path === "/v1/commands") {
    return { name: "command", params: {} };
  }
  if (method === "GET" && path === "/worker/health") {
    return { name: "health", params: {} };
  }
  if (method === "GET" && path === "/v1/oauth/linkedin/start") {
    return { name: "oauthStart", params: {} };
  }
  if (method === "GET" && path === "/v1/oauth/linkedin/whatsapp-onboarding") {
    return { name: "whatsappOnboarding", params: {} };
  }
  if (method === "GET" && path === "/v1/oauth/linkedin/callback") {
    return { name: "oauthCallback", params: {} };
  }
  if (method === "GET" && path === "/v1/oauth/linkedin/status") {
    return { name: "oauthStatus", params: {} };
  }
  if (method === "POST" && path === "/v1/oauth/linkedin/refresh") {
    return { name: "oauthRefresh", params: {} };
  }

  const matches = path.match(/^\/v1\/drafts\/([^/]+)(?:\/(approve|reject|post))?$/);
  if (!matches) {
    return null;
  }

  const draftId = decodeURIComponent(matches[1]);
  const action = matches[2] || "get";

  if (method === "GET" && action === "get") {
    return { name: "getDraft", params: { draftId } };
  }
  if (method === "POST" && action === "approve") {
    return { name: "approveDraft", params: { draftId } };
  }
  if (method === "POST" && action === "reject") {
    return { name: "rejectDraft", params: { draftId } };
  }
  if (method === "POST" && action === "post") {
    return { name: "postDraft", params: { draftId } };
  }

  return null;
}

async function proxyToOpenClaw(req, res) {
  const targetUrl = new URL(req.url || "/", openclawUpstreamUrl).toString();
  const method = req.method || "GET";
  const requestBody = method === "GET" || method === "HEAD" ? undefined : await readRawBody(req);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers["content-length"];

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: requestBody
  });

  const responseBody = await response.arrayBuffer();
  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") {
      return;
    }
    responseHeaders[key] = value;
  });

  res.writeHead(response.status, responseHeaders);
  res.end(Buffer.from(responseBody));
}

async function handleCreateDraft(body, res) {
  const postText = asString(body?.postText);
  if (!postText || postText.length < 5) {
    return sendJson(res, 400, { error: "invalid_post_text" });
  }

  const draftId = createDraftId();
  const now = new Date().toISOString();
  const sender = asString(body?.sender) || "unknown";
  const draft = {
    draftId,
    status: approvalRequired ? "needs_approval" : "approved",
    source: asString(body?.source) || "api",
    sender,
    postText,
    hashtags: normalizeHashtags(body?.hashtags),
    firstComment: asString(body?.firstComment) || "",
    imagePrompt: asString(body?.imagePrompt) || "",
    approval: approvalRequired ? { required: true } : { required: false },
    linkedin: {},
    createdAt: now,
    updatedAt: now
  };

  await saveDraft(draft);
  return sendJson(res, 201, draft);
}

async function handleGetDraft(draftId, res) {
  const draft = await getDraft(draftId);
  if (!draft) {
    return sendJson(res, 404, { error: "draft_not_found" });
  }
  return sendJson(res, 200, draft);
}

async function handleApproveDraft(draftId, body, res) {
  const draft = await getDraft(draftId);
  if (!draft) {
    return sendJson(res, 404, { error: "draft_not_found" });
  }

  const approver = asString(body?.approver) || "unknown";
  if (approverAllowlist.size > 0 && !approverAllowlist.has(approver)) {
    return sendJson(res, 403, { error: "approver_not_allowed" });
  }

  draft.status = "approved";
  draft.approval = {
    required: approvalRequired,
    approvedBy: approver,
    approvedAt: new Date().toISOString()
  };
  delete draft.rejection;
  draft.updatedAt = new Date().toISOString();

  await saveDraft(draft);
  return sendJson(res, 200, draft);
}

async function handleRejectDraft(draftId, body, res) {
  const draft = await getDraft(draftId);
  if (!draft) {
    return sendJson(res, 404, { error: "draft_not_found" });
  }

  const rejector = asString(body?.rejector);
  if (rejector && approverAllowlist.size > 0 && !approverAllowlist.has(rejector)) {
    return sendJson(res, 403, { error: "rejector_not_allowed" });
  }

  draft.status = "rejected";
  draft.rejection = {
    reason: asString(body?.reason) || "no reason provided",
    rejectedAt: new Date().toISOString(),
    rejectedBy: rejector || "unknown"
  };
  draft.updatedAt = new Date().toISOString();

  await saveDraft(draft);
  return sendJson(res, 200, draft);
}

async function handlePostDraft(draftId, body, res) {
  const draft = await getDraft(draftId);
  if (!draft) {
    return sendJson(res, 404, { error: "draft_not_found" });
  }

  const requester = asString(body?.requester);
  if (requester && approverAllowlist.size > 0 && !approverAllowlist.has(requester)) {
    return sendJson(res, 403, { error: "requester_not_allowed" });
  }

  if (approvalRequired && draft.status !== "approved") {
    return sendJson(res, 409, {
      error: "approval_required",
      message: "Draft must be approved before posting"
    });
  }

  const overrideText = asString(body?.postText);
  const postText = overrideText || draft.postText;

  const result = await publishToLinkedIn({ postText });

  draft.status = "posted";
  draft.linkedin = {
    authorUrn: result.authorUrn,
    postUrn: result.postUrn,
    postUrl: result.postUrl || ""
  };
  draft.postedAt = new Date().toISOString();
  draft.updatedAt = new Date().toISOString();

  await saveDraft(draft);
  return sendJson(res, 200, draft);
}

async function handleCommand(body, res) {
  const text = asString(body?.text);
  const sender = asString(body?.sender) || "unknown";
  if (!text) {
    return sendJson(res, 400, { error: "invalid_command", message: "text is required" });
  }

  const parsed = parseCommand(text);
  if (!parsed) {
    return sendJson(res, 400, {
      error: "invalid_command",
      message: "Supported: draft, revise, approve, reject, post, status"
    });
  }

  if (["approve", "reject", "post"].includes(parsed.name) && approverAllowlist.size > 0 && !approverAllowlist.has(sender)) {
    return sendJson(res, 403, { error: "sender_not_allowed" });
  }

  if (parsed.name === "draft") {
    const syntheticBody = {
      source: "command",
      sender,
      postText: parsed.rest,
      hashtags: parseInlineHashtags(parsed.rest)
    };
    return await handleCreateDraft(syntheticBody, res);
  }

  if (parsed.name === "status") {
    return await handleGetDraft(parsed.draftId, res);
  }

  if (parsed.name === "approve") {
    return await handleApproveDraft(parsed.draftId, { approver: sender }, res);
  }

  if (parsed.name === "reject") {
    return await handleRejectDraft(parsed.draftId, { reason: parsed.rest || "rejected by command", rejector: sender }, res);
  }

  if (parsed.name === "post") {
    return await handlePostDraft(parsed.draftId, { requester: sender }, res);
  }

  if (parsed.name === "revise") {
    const draft = await getDraft(parsed.draftId);
    if (!draft) {
      return sendJson(res, 404, { error: "draft_not_found" });
    }
    if (!parsed.rest || parsed.rest.length < 5) {
      return sendJson(res, 400, { error: "invalid_revision", message: "revision text is required" });
    }

    draft.postText = parsed.rest;
    draft.status = approvalRequired ? "needs_approval" : "approved";
    draft.approval = approvalRequired ? { required: true } : { required: false };
    draft.hashtags = parseInlineHashtags(parsed.rest);
    draft.updatedAt = new Date().toISOString();
    delete draft.rejection;

    await saveDraft(draft);
    return sendJson(res, 200, draft);
  }

  return sendJson(res, 400, { error: "invalid_command" });
}

async function publishToLinkedIn({ postText }) {
  const auth = await resolveLinkedInAuth();
  if (!auth?.accessToken || !auth?.authorUrn) {
    throw new Error("LinkedIn auth unavailable. Run OAuth connect flow or set LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN");
  }

  const response = await fetch(`${linkedinApiBase}/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      ...(linkedinApiVersion ? { "LinkedIn-Version": linkedinApiVersion } : {})
    },
    body: JSON.stringify({
      author: auth.authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: postText
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    })
  });

  if (!response.ok) {
    const body = await safeReadBody(response);
    throw new Error(`LinkedIn publish failed (${response.status}): ${body}`);
  }

  const postUrn = response.headers.get("x-restli-id") || response.headers.get("location") || "unknown";
  return { postUrn, postUrl: "", authorUrn: auth.authorUrn };
}

async function handleOauthStart(res) {
  if (!linkedinClientId || !linkedinClientSecret || !linkedinOauthRedirectUri) {
    return sendJson(res, 500, {
      error: "oauth_config_missing",
      message: "LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI are required"
    });
  }

  const payload = await buildOauthStartPayload();
  return sendJson(res, 200, payload);
}

async function handleWhatsAppOnboarding(res) {
  if (!linkedinClientId || !linkedinClientSecret || !linkedinOauthRedirectUri) {
    return sendJson(res, 500, {
      error: "oauth_config_missing",
      message: "LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI are required"
    });
  }

  const payload = await buildOauthStartPayload();
  const message = [
    "LinkedIn connect is ready.",
    "1) Open this URL and approve access:",
    payload.connectUrl,
    "2) After approval, come back to WhatsApp and run:",
    "status oauth",
    "3) Then create and post with approval:",
    "draft Your post idea here #AI #BuildInPublic",
    "approve DRAFT-YYYYMMDD-XXX",
    "post DRAFT-YYYYMMDD-XXX"
  ].join("\n");

  return sendJson(res, 200, {
    type: "whatsapp_onboarding",
    message,
    connectUrl: payload.connectUrl,
    state: payload.state,
    redirectUri: payload.redirectUri,
    scopes: payload.scopes,
    nextCommands: [
      "status oauth",
      "draft Your post idea here #AI #BuildInPublic",
      "approve DRAFT-YYYYMMDD-XXX",
      "post DRAFT-YYYYMMDD-XXX"
    ]
  });
}

async function buildOauthStartPayload() {
  const state = randomUUID();
  await saveOauthState(state, { createdAt: Date.now() });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: linkedinClientId,
    redirect_uri: linkedinOauthRedirectUri,
    scope: linkedinOauthScopes,
    state
  });

  const connectUrl = `${linkedinOauthBase}/oauth/v2/authorization?${params.toString()}`;
  return {
    connectUrl,
    state,
    redirectUri: linkedinOauthRedirectUri,
    scopes: linkedinOauthScopes
  };
}

async function handleOauthCallback(requestUrl, res) {
  const error = requestUrl.searchParams.get("error");
  if (error) {
    return sendOauthHtml(res, 400, `LinkedIn OAuth failed: ${escapeHtml(error)}`);
  }

  const code = requestUrl.searchParams.get("code") || "";
  const state = requestUrl.searchParams.get("state") || "";
  if (!code || !state) {
    return sendOauthHtml(res, 400, "Missing code/state query params");
  }

  const stateExists = await consumeOauthState(state);
  if (!stateExists) {
    return sendOauthHtml(res, 400, "Invalid or expired OAuth state");
  }

  const tokenInfo = await exchangeAuthorizationCode(code);
  await saveOauthToken(tokenInfo);

  return sendOauthHtml(res, 200, "LinkedIn connected. You can return to WhatsApp and continue.");
}

async function handleOauthStatus(res) {
  const oauthToken = await loadOauthToken();
  const auth = await resolveLinkedInAuth();

  if (!auth?.accessToken || !auth?.authorUrn) {
    return sendJson(res, 200, {
      connected: false,
      source: "none"
    });
  }

  return sendJson(res, 200, {
    connected: true,
    source: oauthToken?.accessToken ? "oauth" : "env",
    authorUrn: auth.authorUrn,
    expiresAt: oauthToken?.expiresAt || null,
    refreshAvailable: Boolean(oauthToken?.refreshToken)
  });
}

async function handleOauthRefresh(res) {
  const oauthToken = await loadOauthToken();
  if (!oauthToken?.refreshToken) {
    return sendJson(res, 400, {
      error: "refresh_token_missing",
      message: "No refresh token available in storage"
    });
  }

  const refreshed = await refreshOAuthToken(oauthToken.refreshToken, oauthToken);
  await saveOauthToken(refreshed);

  return sendJson(res, 200, {
    ok: true,
    expiresAt: refreshed.expiresAt || null,
    authorUrn: refreshed.authorUrn || null
  });
}

async function resolveLinkedInAuth() {
  let oauthToken = await loadOauthToken();

  if (oauthToken?.accessToken) {
    if (linkedinOauthAutoRefresh && tokenIsStale(oauthToken) && oauthToken.refreshToken) {
      const refreshed = await refreshOAuthToken(oauthToken.refreshToken, oauthToken);
      await saveOauthToken(refreshed);
      oauthToken = refreshed;
    }

    if (oauthToken.accessToken && oauthToken.authorUrn) {
      return {
        accessToken: oauthToken.accessToken,
        authorUrn: oauthToken.authorUrn
      };
    }
  }

  if (linkedinAccessToken && linkedinAuthorUrn) {
    return {
      accessToken: linkedinAccessToken,
      authorUrn: linkedinAuthorUrn
    };
  }

  return null;
}

function tokenIsStale(tokenInfo) {
  if (!tokenInfo?.expiresAt) {
    return false;
  }
  const expiryMs = Date.parse(tokenInfo.expiresAt);
  if (Number.isNaN(expiryMs)) {
    return false;
  }
  return Date.now() + 120000 >= expiryMs;
}

async function exchangeAuthorizationCode(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: linkedinOauthRedirectUri,
    client_id: linkedinClientId,
    client_secret: linkedinClientSecret
  });

  const response = await fetch(`${linkedinOauthBase}/oauth/v2/accessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const body = await safeReadBody(response);
    throw new Error(`OAuth code exchange failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  return await normalizeOauthTokenResponse(json);
}

async function refreshOAuthToken(refreshToken, previousToken = null) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: linkedinClientId,
    client_secret: linkedinClientSecret
  });

  const response = await fetch(`${linkedinOauthBase}/oauth/v2/accessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const body = await safeReadBody(response);
    throw new Error(`OAuth refresh failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  return await normalizeOauthTokenResponse(json, previousToken);
}

async function normalizeOauthTokenResponse(json, previousToken = null) {
  const nowMs = Date.now();
  const expiresIn = Number(json?.expires_in || 0);
  const refreshExpiresIn = Number(json?.refresh_token_expires_in || 0);
  const accessToken = asString(json?.access_token) || asString(previousToken?.accessToken);
  const refreshToken = asString(json?.refresh_token) || asString(previousToken?.refreshToken);
  const scope = asString(json?.scope) || asString(previousToken?.scope);

  if (!accessToken) {
    throw new Error("OAuth token response did not include access_token");
  }

  let authorUrn = asString(previousToken?.authorUrn) || linkedinAuthorUrn;
  try {
    if (!authorUrn) {
      const sub = await fetchLinkedInSub(accessToken);
      if (sub) {
        authorUrn = `urn:li:person:${sub}`;
      }
    }
  } catch {
    // If userinfo fails, fall back to configured env urn.
    authorUrn = authorUrn || linkedinAuthorUrn;
  }

  return {
    accessToken,
    refreshToken: refreshToken || "",
    scope,
    tokenType: asString(json?.token_type) || "Bearer",
    expiresAt: expiresIn > 0 ? new Date(nowMs + expiresIn * 1000).toISOString() : null,
    refreshExpiresAt: refreshExpiresIn > 0 ? new Date(nowMs + refreshExpiresIn * 1000).toISOString() : null,
    authorUrn,
    updatedAt: new Date(nowMs).toISOString()
  };
}

async function fetchLinkedInSub(accessToken) {
  const response = await fetch(`${linkedinApiBase}/v2/userinfo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(linkedinApiVersion ? { "LinkedIn-Version": linkedinApiVersion } : {})
    }
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  return asString(data?.sub);
}

async function loadOauthToken() {
  if (!useRedis) {
    return oauthTokenCache;
  }

  const raw = await runRedisCommand(["GET", buildOauthTokenKey()]);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveOauthToken(tokenInfo) {
  if (!tokenInfo) {
    return;
  }
  if (!useRedis) {
    oauthTokenCache = tokenInfo;
    return;
  }
  await runRedisCommand(["SET", buildOauthTokenKey(), JSON.stringify(tokenInfo)]);
}

async function saveOauthState(state, payload) {
  if (!useRedis) {
    oauthStateCache.set(state, payload);
    return;
  }

  await runRedisCommand(["SETEX", buildOauthStateKey(state), String(linkedinOauthStateTtlSec), JSON.stringify(payload)]);
}

async function consumeOauthState(state) {
  if (!useRedis) {
    const exists = oauthStateCache.has(state);
    oauthStateCache.delete(state);
    return exists;
  }

  const key = buildOauthStateKey(state);
  const value = await runRedisCommand(["GET", key]);
  await runRedisCommand(["DEL", key]);
  return Boolean(value);
}

function buildOauthTokenKey() {
  return `${redisKeyPrefix}:oauth:linkedin`;
}

function buildOauthStateKey(state) {
  return `${redisKeyPrefix}:oauth_state:${state}`;
}

function sendOauthHtml(res, status, message) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>LinkedIn OAuth</title></head><body><h2>${escapeHtml(message)}</h2></body></html>`;
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html)
  });
  res.end(html);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function parseCommand(text) {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 0) {
    return null;
  }

  const name = parts[0].toLowerCase();
  const supported = new Set(["draft", "revise", "approve", "reject", "post", "status"]);
  if (!supported.has(name)) {
    return null;
  }

  if (name === "draft") {
    const rest = text.trim().slice(parts[0].length).trim();
    return rest ? { name, rest } : null;
  }

  if (name === "status" || name === "approve" || name === "post") {
    if (parts.length < 2) {
      return null;
    }
    return { name, draftId: parts[1] };
  }

  if (name === "reject" || name === "revise") {
    if (parts.length < 3) {
      return null;
    }
    const draftId = parts[1];
    const rest = text.trim().slice(parts[0].length + 1 + draftId.length).trim();
    return { name, draftId, rest };
  }

  return null;
}

function parseInlineHashtags(text) {
  if (!text) {
    return [];
  }
  const matches = text.match(/#[A-Za-z0-9_]+/g);
  return Array.isArray(matches) ? matches : [];
}

async function getDraft(draftId) {
  if (!useRedis) {
    return drafts.get(draftId) || null;
  }

  const key = buildDraftKey(draftId);
  const value = await runRedisCommand(["GET", key]);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function saveDraft(draft) {
  if (!useRedis) {
    drafts.set(draft.draftId, draft);
    return;
  }

  const key = buildDraftKey(draft.draftId);
  await runRedisCommand(["SET", key, JSON.stringify(draft)]);
}

function buildDraftKey(draftId) {
  return `${redisKeyPrefix}:draft:${draftId}`;
}

async function runRedisCommand(args) {
  const response = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([args])
  });

  if (!response.ok) {
    const body = await safeReadBody(response);
    throw new Error(`Redis command failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const first = payload[0];
  if (first?.error) {
    throw new Error(`Redis error: ${first.error}`);
  }

  return first?.result ?? null;
}

async function readJson(req) {
  const raw = await readRawBody(req);
  const trimmed = raw.toString("utf8").trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBool(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseAllowlist(value) {
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHashtags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.startsWith("#"));
}

function createDraftId() {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 3).toUpperCase();
  return `DRAFT-${yyyy}${mm}${dd}-${suffix}`;
}

async function safeReadBody(response) {
  try {
    return await response.text();
  } catch {
    return "<no response body>";
  }
}
