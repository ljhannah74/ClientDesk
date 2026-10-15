export interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string;
    unitPrice: number;
    isActive: boolean;
}

export interface ProductRequest {
    name: string;
    description: string | null;
    sku: string;
    unitPrice: number;
    isActive: boolean;
}