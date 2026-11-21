import type { Product } from "../types/Product";
import { getApiBaseUrl } from "./apiConfig";

const getProductsUrl = () => 
    `${getApiBaseUrl()}/api/products`;

export const getProducts = async (): Promise<Product[]> => {
    const response = await fetch(getProductsUrl());
    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
    }
    return response.json();
};

export const getProductById = async (id: number): Promise<Product> => {
    const response = await fetch(`${getProductsUrl()    }/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch product");
    }
    return response.json();
};

export interface CreateProductData {
    sku: string;
    name: string;
    description: string | null;
    unitPrice: number;
    isActive: boolean;
}

export async function createProduct(
    product: CreateProductData
): Promise<Product> {
    const response = await fetch(getProductsUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            message || `Failed to create product: ${response.status}`
        );
    }

    return response.json();
}