import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, synchronizeOrders } from "../lib/orders.js";

test("normalizes common Russian phone formats", () => {
  assert.equal(normalizePhone("+7 999 123-45-67"), "+79991234567");
  assert.equal(normalizePhone("8 (999) 123 45 67"), "+79991234567");
  assert.equal(normalizePhone("9005551212"), "+79005551212");
  assert.equal(normalizePhone("123"), null);
  assert.equal(normalizePhone("не указан"), null);
});

test("deduplicates by amount, then by latest creation time", () => {
  const result = synchronizeOrders([
    { name: "old", phone: "89991234567", email: "old@example.com", amount: 100, created_at: "2026-01-01T00:00:00Z" },
    { name: "new", phone: "+7 999 123 45 67", email: "new@example.com", amount: 100, created_at: "2026-01-02T00:00:00Z" },
    { name: "max", phone: "79991234567", email: "", amount: 200, created_at: "2025-01-01T00:00:00Z" },
    { name: "invalid", phone: "123", email: "", amount: 999, created_at: "2026-01-01T00:00:00Z" },
  ]);

  assert.deepEqual(result, {
    clients: [{ name: "max", phone: "+79991234567", email: "", amount: 200 }],
    stats: { received: 4, unique: 1, duplicates_merged: 2, invalid_dropped: 1 },
  });
});
