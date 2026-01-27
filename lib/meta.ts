import crypto from "node:crypto";

const META_API_VERSION = "v19.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const META_OAUTH_URL = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`;

type OAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type StatePayload = {
  uid: string;
  nonce: string;
  ts: number;
};

const base64UrlEncode = (input: Buffer | string): string => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

const signPayload = (payload: string, secret: string): string =>
  base64UrlEncode(crypto.createHmac("sha256", secret).update(payload).digest());

export const createSignedState = (payload: StatePayload, secret: string): string => {
  const raw = JSON.stringify(payload);
  const signature = signPayload(raw, secret);
  return `${base64UrlEncode(raw)}.${signature}`;
};

export const verifySignedState = (
  state: string,
  secret: string,
): StatePayload | null => {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  try {
    const raw = base64UrlDecode(encoded);
    const expectedSignature = signPayload(raw, secret);
    if (expectedSignature !== signature) return null;
    const payload = JSON.parse(raw) as StatePayload;
    if (!payload.uid || !payload.nonce || !payload.ts) return null;
    return payload;
  } catch {
    return null;
  }
};

export const createMetaAuthUrl = ({
  appId,
  redirectUri,
  state,
  scope,
}: {
  appId: string;
  redirectUri: string;
  state: string;
  scope: string;
}): string => {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope,
  });
  return `${META_OAUTH_URL}?${params.toString()}`;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message || errorBody?.message || res.statusText,
    );
  }
  return (await res.json()) as T;
};

export const exchangeCodeForToken = async ({
  appId,
  appSecret,
  redirectUri,
  code,
}: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
}): Promise<OAuthTokenResponse> => {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const url = `${META_BASE_URL}/oauth/access_token?${params.toString()}`;
  return fetchJson<OAuthTokenResponse>(url);
};

export const exchangeForLongLivedToken = async ({
  appId,
  appSecret,
  shortLivedToken,
}: {
  appId: string;
  appSecret: string;
  shortLivedToken: string;
}): Promise<OAuthTokenResponse> => {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  const url = `${META_BASE_URL}/oauth/access_token?${params.toString()}`;
  return fetchJson<OAuthTokenResponse>(url);
};

type PageAccountsResponse = {
  data?: Array<{
    id: string;
    name?: string;
    instagram_business_account?: {
      id: string;
      username?: string;
      account_type?: string;
    };
  }>;
};

export const fetchInstagramBusinessAccount = async (
  accessToken: string,
): Promise<{
  pageId: string;
  pageName?: string;
  instagramUserId: string;
  instagramUsername?: string;
} | null> => {
  const params = new URLSearchParams({
    fields: "id,name,instagram_business_account{id,username,account_type}",
    access_token: accessToken,
  });
  const url = `${META_BASE_URL}/me/accounts?${params.toString()}`;
  const response = await fetchJson<PageAccountsResponse>(url);
  const pages = response?.data ?? [];
  for (const page of pages) {
    const ig = page.instagram_business_account;
    if (ig?.id) {
      return {
        pageId: page.id,
        pageName: page.name,
        instagramUserId: ig.id,
        instagramUsername: ig.username,
      };
    }
  }
  return null;
};
