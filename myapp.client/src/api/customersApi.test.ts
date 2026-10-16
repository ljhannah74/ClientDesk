import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteCustomer, getCustomers } from "./customersApi";

afterEach(() => vi.unstubAllGlobals());

describe("customer API errors", () => {
    it.each([
        [400, JSON.stringify({errors: {Name: ["Name is required."]}}), "application/problem+json", "Name is required."],
        [409, "Customer has orders and cannot be deleted.", "text/plain", "Customer has orders and cannot be deleted."],
        [404, "", "application/json", "This customer no longer exists."],
        [500, "<html>private exception</html>", "text/html", "Unable to delete customer."],
    ])("handles HTTP %s", async (status, body, type, message) => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, {
            status, headers: {"content-type": type},
        })));
        await expect(deleteCustomer(7)).rejects.toThrow(message);
    });

    it("explains connection failures", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
        await expect(getCustomers()).rejects.toThrow("Unable to reach the server.");
    });

    it("returns successful customer data", async () => {
        const customers = [{id: 7, name: "Alex Example"}];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(customers))));
        await expect(getCustomers()).resolves.toEqual(customers);
    });
});
