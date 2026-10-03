import { normalizeApiOrigin } from "@/lib/api-origin";

export const dynamic = "force-dynamic";

const API_ORIGIN = normalizeApiOrigin(
  process.env.INTERNAL_API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? "http://127.0.0.1:8000",
);

async function proxyApiRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const upstreamUrl = new URL(`/api/${path.join("/")}/`, API_ORIGIN);
  upstreamUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  for (const header of ["connection", "content-length", "host", "keep-alive", "transfer-encoding", "upgrade"]) {
    headers.delete(header);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  // fetch() may transparently decompress the upstream body. Do not forward
  // encoding or length metadata that describes the original compressed body.
  for (const header of ["connection", "content-encoding", "content-length", "keep-alive", "transfer-encoding", "upgrade"]) {
    responseHeaders.delete(header);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyApiRequest;
export const HEAD = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
export const OPTIONS = proxyApiRequest;
