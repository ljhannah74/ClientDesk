import type { Customer } from "../types/Customer";
import { getApiBaseUrl } from "./apiConfig";

async function throwCustomerError(response: Response, fallback: string): Promise<never> {
    // Do not expose server exception pages for unexpected failures.
    if (response.status >= 500) throw new Error(fallback);
    const body = await response.text();
    let message = "";
    try {
        const payload: unknown = JSON.parse(body);
        if (typeof payload === "string") {
            message = payload;
        } else if (payload && typeof payload === "object") {
            const problem = payload as { errors?: Record<string, unknown>; detail?: unknown };
            const messages = Object.values(problem.errors ?? {}).flat()
                .filter((value): value is string => typeof value === "string");
            message = messages.join(" ") ||
                (typeof problem.detail === "string" ? problem.detail : "");
        }
    } catch {
        if (response.headers.get("content-type")?.includes("text/plain")) message = body.trim();
    }
    throw new Error(message || (response.status === 404
        ? "This customer no longer exists. Refresh the customer list."
        : fallback));
}

async function customerFetch(url: string, options?: RequestInit): Promise<Response> {
    try {
        return await fetch(url, options);
    } catch {
        throw new Error("Unable to reach the server. Check your connection and try again.");
    }
}

function getCustomersUrl(): string {
    return `${getApiBaseUrl()}/api/customers`;
}

export async function getCustomers(): Promise<Customer[]> {
    const response = await customerFetch(
        getCustomersUrl()
    );

    if (!response.ok) {
        return throwCustomerError(response, "Unable to load customers. Please try again.");
    }

    return response.json();
}

export async function createCustomer(
    customer: Omit<Customer, "id">
): Promise<Customer> {
    const response = await customerFetch(
        getCustomersUrl(),
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(customer),
        }
    );

    if (!response.ok) {
        return throwCustomerError(response, "Unable to create customer. Please try again.");
    }

    return response.json();
}

export async function updateCustomer(
    customer: Customer
): Promise<void> {
    const response = await customerFetch(
        `${getCustomersUrl()}/${customer.id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(customer),
        }
    );

    if (!response.ok) {
        return throwCustomerError(response, "Unable to update customer. Please try again.");
    }
}

export async function deleteCustomer(
    id: number
): Promise<void> {
    const response = await customerFetch(
        `${getCustomersUrl()}/${id}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        return throwCustomerError(response, "Unable to delete customer. Please try again.");
    }
}
