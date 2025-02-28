export function createErrorResponse(error: unknown, status: number = 500): Response {
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : error,
      status,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export function createSuccessResponse(data: unknown, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
