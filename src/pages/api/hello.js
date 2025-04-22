export function get() {
  return new Response(
    JSON.stringify({ message: "Hello API is working" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
} 