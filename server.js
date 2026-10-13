import { createServer } from "node:http";
import { fetchAndSynchronize } from "./lib/orders.js";

const port = Number(process.env.PORT) || 3000;

createServer(async (request, response) => {
  if (request.method !== "GET" || new URL(request.url, `http://${request.headers.host}`).pathname !== "/") {
    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    return response.end(JSON.stringify({ error: "Not Found" }));
  }

  try {
    const result = await fetchAndSynchronize();
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Failed to synchronize orders" }));
  }
}).listen(port, () => console.log(`Listening on http://localhost:${port}`));
