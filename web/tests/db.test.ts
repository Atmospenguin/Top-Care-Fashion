import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, executeMock } = vi.hoisted(() => {
  const queryMock = vi.fn();
  const executeMock = vi.fn();
  return { queryMock, executeMock };
});

vi.mock("@prisma/client", () => {
  const toText = (value: unknown): string => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      if ("text" in (value as Record<string, unknown>)) {
        return String((value as Record<string, unknown>).text);
      }
      if ("raw" in (value as Record<string, unknown>)) {
        return String((value as Record<string, unknown>).raw);
      }
    }
    return String(value);
  };

  const Prisma = {
    raw: (value: string) => ({ raw: value, text: value }),
    sql: (strings: TemplateStringsArray | string, ...values: unknown[]) => {
      if (Array.isArray(strings)) {
        let text = "";
        strings.forEach((segment, index) => {
          text += segment;
          if (index < values.length) {
            text += toText(values[index]);
          }
        });
        return { text };
      }
      return { text: toText(strings) };
    },
  };

  class PrismaClient {
    public $queryRaw = queryMock;
    public $executeRaw = executeMock;
  }

  return { PrismaClient, Prisma, __internal: { queryMock, executeMock } };
});

import { getConnection, parseJson, toBoolean, toNumber } from "@/lib/db";
import { __internal } from "@prisma/client";

describe("database helpers", () => {
  beforeEach(() => {
    __internal.queryMock.mockReset();
    __internal.executeMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toNumber", () => {
    it("returns numbers for numeric inputs", () => {
      expect(toNumber(12)).toBe(12);
      expect(toNumber("34.5")).toBeCloseTo(34.5);
    });

    it("handles decimal-like objects", () => {
      const decimal = { toNumber: () => 9.87 };
      expect(toNumber(decimal)).toBeCloseTo(9.87);
    });

    it("returns null for invalid values", () => {
      expect(toNumber("not-a-number")).toBeNull();
      expect(toNumber(undefined)).toBeNull();
    });
  });

  describe("toBoolean", () => {
    it("coerces common truthy representations", () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean("1")).toBe(true);
      expect(toBoolean("t")).toBe(true);
      expect(toBoolean("true")).toBe(true);
    });

    it("falls back to standard boolean coercion", () => {
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(null)).toBe(false);
      expect(toBoolean("false")).toBe(false);
    });
  });

  describe("parseJson", () => {
    it("parses JSON strings", () => {
      expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    });

    it("returns null for invalid JSON", () => {
      expect(parseJson("{invalid}")).toBeNull();
    });

    it("passes through non-string values", () => {
      const original = { nested: true };
      expect(parseJson(original)).toBe(original);
    });
  });

  describe("getConnection.execute", () => {
    it("routes SELECT queries through $queryRaw", async () => {
      __internal.queryMock.mockResolvedValueOnce([{ id: 1 }]);

      const conn = await getConnection();
      const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [1]);

      expect(__internal.queryMock).toHaveBeenCalledTimes(1);
      const callArg = __internal.queryMock.mock.calls[0][0];
      expect(callArg.text).toContain("SELECT * FROM users");
      expect(rows).toEqual([{ id: 1 }]);
    });

    it("appends RETURNING id for inserts without it", async () => {
      __internal.queryMock.mockResolvedValueOnce([{ id: 42 }]);

      const conn = await getConnection();
      const [result] = await conn.execute(
        "INSERT INTO widgets (name) VALUES (?)",
        ["Widget"]
      );

      expect(__internal.queryMock).toHaveBeenCalledTimes(1);
      const callArg = __internal.queryMock.mock.calls[0][0];
      expect(callArg.text).toMatch(/RETURNING\s+id/i);
      expect(result.insertId).toBe(42);
    });

    it("uses $executeRaw for non-returning mutations", async () => {
      __internal.executeMock.mockResolvedValueOnce(3);

      const conn = await getConnection();
      const [result] = await conn.execute(
        "UPDATE widgets SET name = ? WHERE id = ?",
        ["Updated", 5]
      );

      expect(__internal.queryMock).not.toHaveBeenCalled();
      expect(__internal.executeMock).toHaveBeenCalledTimes(1);
      const callArg = __internal.executeMock.mock.calls[0][0];
      expect(callArg.text).toContain("UPDATE widgets SET name");
      expect(result.affectedRows).toBe(3);
      expect(result.rowCount).toBe(3);
    });
  });
});
