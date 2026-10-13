export const ORDERS_URL = "https://test.ooobs.ru/api/orders";

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }

  return null;
}

function isBetterOrder(candidate, current) {
  const candidateAmount = Number(candidate.amount);
  const currentAmount = Number(current.amount);

  if (candidateAmount !== currentAmount) {
    return candidateAmount > currentAmount;
  }

  return Date.parse(candidate.created_at) > Date.parse(current.created_at);
}

export function synchronizeOrders(orders) {
  const clientsByPhone = new Map();
  let invalidDropped = 0;
  let validReceived = 0;

  for (const order of orders) {
    const phone = normalizePhone(order.phone);
    if (!phone) {
      invalidDropped += 1;
      continue;
    }

    validReceived += 1;
    const candidate = { ...order, phone };
    const current = clientsByPhone.get(phone);

    if (!current || isBetterOrder(candidate, current)) {
      clientsByPhone.set(phone, candidate);
    }
  }

  const clients = [...clientsByPhone.values()].map(({ name, phone, email, amount }) => ({
    name,
    phone,
    email,
    amount: Number(amount),
  }));

  return {
    clients,
    stats: {
      received: orders.length,
      unique: clients.length,
      duplicates_merged: validReceived - clients.length,
      invalid_dropped: invalidDropped,
    },
  };
}

export async function fetchAndSynchronize(fetchImpl = fetch) {
  const response = await fetchImpl(ORDERS_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Upstream returned HTTP ${response.status}`);
  }

  const orders = await response.json();
  if (!Array.isArray(orders)) {
    throw new TypeError("Upstream response must be a JSON array");
  }

  return synchronizeOrders(orders);
}
