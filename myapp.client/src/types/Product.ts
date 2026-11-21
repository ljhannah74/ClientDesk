export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    unitPrice: number;
    isActive: boolean;
}
