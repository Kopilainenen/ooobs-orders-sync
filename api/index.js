import { fetchAndSynchronize } from "../lib/orders.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const result = await fetchAndSynchronize();
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return response.status(200).json(result);
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: "Failed to synchronize orders" });
  }
}
