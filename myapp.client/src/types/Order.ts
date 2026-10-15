export type OrderStatus =
    | "New"
    | "Processing"
    | "Completed"
    | "Cancelled";

export interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface Order {
    id: number;
    orderNumber: string;
    orderDate: string;
    customerId: number;
    description: string | null;
    status: OrderStatus;
    items: OrderItem[];
    total: number;
}

export interface OrderItemRequest {
    id?: number;
    productId: number;
    quantity: number;
}

export interface OrderRequest {
    orderNumber: string;
    orderDate: string;
    customerId: number;
    description: string | null;
    status: OrderStatus;
    items: OrderItemRequest[];
}