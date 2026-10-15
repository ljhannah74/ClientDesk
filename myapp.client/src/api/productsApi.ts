import { getApiBaseUrl } from "./apiConfig";
import type { Product, ProductRequest } from "../types/Product";

function getProductsUrl(): string {
    return `${getApiBaseUrl()}/api/products`;
}

export class ProductsApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ProductsApiError";
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
                message = (problem.errors
                    ? Object.values(problem.errors).flat().join(" ")
                    : "") || problem.detail || problem.title || message;
            }
        } catch {
            message = message.replace(/^"|"$/g, "");
        }
    }

    throw new ProductsApiError(message || fallback, response.status);
}

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(getProductsUrl());
    if (!response.ok) {
        return throwResponseError(response, "Failed to retrieve products.");
    }
    return response.json();
}

export async function createProduct(request: ProductRequest): Promise<Product> {
    const response = await fetch(getProductsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        return throwResponseError(response, "Failed to create product.");
    }
    return response.json();
}

export async function updateProduct(
    id: number,
    request: ProductRequest
): Promise<Product> {
    const response = await fetch(`${getProductsUrl()}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        return throwResponseError(response, "Failed to update product.");
    }
    return response.json();
}

export async function deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${getProductsUrl()}/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        return throwResponseError(response, "Failed to delete product.");
    }
}