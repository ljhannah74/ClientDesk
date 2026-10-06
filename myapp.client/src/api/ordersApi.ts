import { getApiBaseUrl } from "./apiConfig";
import type { Order, OrderRequest } from "../types/Order";

function getOrdersUrl(): string {
    return `${getApiBaseUrl()}/api/orders`;
}

export class OrdersApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "OrdersApiError";
        this.status = status;
    }
}

async function throwResponseError(
    response: Response,
    fallback: string
): Promise<never> {
    const body = await response.text();
    let message = body.trim();

    if (message) {
        try {
            const payload: unknown = JSON.parse(message);
            if (typeof payload === "string") {
                message = payload;
            } else if (payload && typeof payload === "object") {
                const problem = payload as {
                    title?: string;
                    detail?: string;
                    errors?: Record<string, string[]>;
                };
                const validationMessages = problem.errors
                    ? Object.values(problem.errors).flat()
                    : [];
                message = validationMessages.join(" ")
                    || problem.detail
                    || problem.title
                    || message;
            }
        } catch {
            message = message.replace(/^"|"$/g, "");
        }
    }

    throw new OrdersApiError(
        message || fallback,
        response.status
    );
}

export async function getOrders(): Promise<Order[]> {
    const response = await fetch(getOrdersUrl());

    if (!response.ok) {
        return throwResponseError(response, "Failed to retrieve orders.");
    }

    return response.json();
}

export async function createOrder(request: OrderRequest): Promise<Order> {
    const response = await fetch(getOrdersUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        return throwResponseError(response, "Failed to create order.");
    }

    return response.json();
}

export async function updateOrder(
    id: number,
    request: OrderRequest
): Promise<void> {
    const response = await fetch(`${getOrdersUrl()}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        return throwResponseError(response, "Failed to update order.");
    }
}

export async function deleteOrder(id: number): Promise<void> {
    const response = await fetch(`${getOrdersUrl()}/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        return throwResponseError(response, "Failed to delete order.");
    }
}