export type OrderStatus =
    | "New"
    | "Processing"
    | "Completed"
    | "Cancelled";

export interface Order {
    id: number;
    orderNumber: string;
    orderDate: string;
    customerId: number;
    customer: null;
    description: string | null;
    status: OrderStatus;
}

export interface OrderRequest {
    orderNumber: string;
    orderDate: string;
    customerId: number;
    description: string | null;
    status: OrderStatus;
}