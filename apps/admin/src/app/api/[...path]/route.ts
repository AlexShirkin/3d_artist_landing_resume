import { NextRequest, NextResponse } from "next/server";

const GATEWAY = process.env.API_URL || "http://gateway:4000";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const target = new URL(
    `/api/${path.join("/")}${request.nextUrl.search}`,
    GATEWAY
  );

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: body?.byteLength ? body : undefined,
  });

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
