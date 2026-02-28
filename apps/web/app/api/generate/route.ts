// IMPORTANT! Set the runtime to edge: https://vercel.com/docs/functions/edge-functions/edge-runtime
export const runtime = "edge";

export async function POST(): Promise<Response> {
  return new Response("AI generation is disabled in this deployment.", {
    status: 501,
  });
}
