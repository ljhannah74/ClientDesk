import { useState } from "react";
import type { Customer } from "../types/Customer";
import type { Product } from "../types/Product";
import type { Order, OrderRequest, OrderStatus } from "../types/Order";

interface OrderDialogProps {
    open: boolean;
    customers: Customer[];
    products: Product[];
    order?: Order | null;
    onSave: (request: OrderRequest) => Promise<void>;
    onCancel: () => void;
}

type OrderDialogFormProps = Omit<OrderDialogProps, "open">;

interface OrderItemDraft {
    key: string;
    id?: number;
    productId: number | null;
    quantity: number;
    unitPrice: number;
}

const statuses: OrderStatus[] = [
    "New",
    "Processing",
    "Completed",
    "Cancelled",
];

function toLocalDateTime(value: string): string {
    const date = new Date(value);
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000
    );
    return localDate.toISOString().slice(0, 16);
}

function currentLocalDateTime(): string {
    return toLocalDateTime(new Date().toISOString());
}

function orderItemDrafts(order?: Order | null): OrderItemDraft[] {
    return order?.items.map((item) => ({
        key: `item-${item.id}`,
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
    })) ?? [];
}

export default function OrderDialog({
    open,
    ...props
}: OrderDialogProps) {
    if (!open) {
        return null;
    }

    return (
        <OrderDialogForm
            key={props.order?.id ?? "new"}
            {...props}
        />
    );
}

function OrderDialogForm({
    customers,
    products,
    order,
    onSave,
    onCancel,
}: OrderDialogFormProps) {
    const [orderNumber, setOrderNumber] = useState(order?.orderNumber ?? "");
    const [orderDate, setOrderDate] = useState(() => order
        ? toLocalDateTime(order.orderDate)
        : currentLocalDateTime());
    const [customerId, setCustomerId] = useState(order ? String(order.customerId) : "");
    const [description, setDescription] = useState(order?.description ?? "");
    const [status, setStatus] = useState<OrderStatus>(order?.status ?? "New");
    const [items, setItems] = useState<OrderItemDraft[]>(() => orderItemDrafts(order));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!orderNumber.trim()) {
            setError("Order number is required.");
            return;
        }

        if (!orderDate || Number.isNaN(new Date(orderDate).getTime())) {
            setError("A valid order date is required.");
            return;
        }

        if (!customerId) {
            setError("Select a customer.");
            return;
        }

        if (items.some((item) => !item.productId
            || !Number.isInteger(item.quantity)
            || item.quantity < 1)) {
            setError("Each product line needs a product and a positive whole-number quantity.");
            return;
        }

        if (new Set(items.map((item) => item.productId)).size !== items.length) {
            setError("A product can only appear once on an order.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await onSave({
                orderNumber: orderNumber.trim(),
                orderDate: new Date(orderDate).toISOString(),
                customerId: Number(customerId),
                description: description.trim() || null,
                status,
                items: items.map(({ id, productId, quantity }) => ({
                    ...(id === undefined ? {} : { id }),
                    productId: productId!,
                    quantity,
                })),
            });
        } catch (saveError) {
            console.error(saveError);
            setError(saveError instanceof Error
                ? saveError.message
                : "Unable to save order.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dialog-backdrop">
            <div className="dialog order-dialog">
                <h2>{order ? "Edit Order" : "Add Order"}</h2>

                {customers.length === 0 ? (
                    <>
                        <p>Add a customer before creating an order.</p>
                        <div className="dialog-actions">
                            <button type="button" onClick={onCancel}>
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="order-number">Order number</label>
                            <input
                                id="order-number"
                                type="text"
                                maxLength={50}
                                value={orderNumber}
                                onChange={(event) => setOrderNumber(event.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="order-date">Order date</label>
                            <input
                                id="order-date"
                                type="datetime-local"
                                value={orderDate}
                                onChange={(event) => setOrderDate(event.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="order-customer">Customer</label>
                            <select
                                id="order-customer"
                                value={customerId}
                                onChange={(event) => setCustomerId(event.target.value)}
                            >
                                <option value="">Select a customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="order-description">Description</label>
                            <input
                                id="order-description"
                                type="text"
                                maxLength={500}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="order-status">Status</label>
                            <select
                                id="order-status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                            >
                                {statuses.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>

                        <div className="order-items-section">
                            <div className="order-items-heading">
                                <h3>Products</h3>
                                <button
                                    type="button"
                                    onClick={() => setItems((current) => [...current, {
                                        key: crypto.randomUUID(),
                                        productId: null,
                                        quantity: 1,
                                        unitPrice: 0,
                                    }])}
                                    disabled={products.length === 0}
                                >
                                    Add product line
                                </button>
                            </div>

                            {products.length === 0 && (
                                <p>No products are available for order lines.</p>
                            )}

                            {items.length > 0 && (
                                <div className="order-items-table">
                                    <div className="order-item-labels">
                                        <span>Product</span>
                                        <span>Quantity</span>
                                        <span>Unit price</span>
                                        <span>Line total</span>
                                        <span></span>
                                    </div>
                                    {items.map((item) => {
                                        const selectedProduct = products.find(
                                            (product) => product.id === item.productId
                                        );
                                        const availableProducts = products.filter(
                                            (product) => product.isActive
                                                || product.id === item.productId
                                        );

                                        return (
                                            <div className="order-item-row" key={item.key}>
                                                <select
                                                    aria-label="Product"
                                                    value={item.productId?.toString() ?? ""}
                                                    onChange={(event) => {
                                                        const productId = Number(event.target.value) || null;
                                                        const product = products.find(
                                                            (value) => value.id === productId
                                                        );
                                                        setItems((current) => current.map((value) =>
                                                            value.key === item.key
                                                                ? {
                                                                    ...value,
                                                                    productId,
                                                                    unitPrice: product?.unitPrice ?? 0,
                                                                }
                                                                : value
                                                        ));
                                                    }}
                                                >
                                                    <option value="">Select product</option>
                                                    {availableProducts.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.sku} - {product.name}
                                                            {!product.isActive ? " (Inactive)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    aria-label="Quantity"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(event) => {
                                                        const quantity = Number(event.target.value);
                                                        setItems((current) => current.map((value) =>
                                                            value.key === item.key
                                                                ? { ...value, quantity }
                                                                : value
                                                        ));
                                                    }}
                                                />
                                                <span>{item.unitPrice.toFixed(2)}</span>
                                                <span>{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                                <button
                                                    type="button"
                                                    aria-label="Remove product line"
                                                    onClick={() => setItems((current) =>
                                                        current.filter((value) => value.key !== item.key)
                                                    )}
                                                >
                                                    Remove
                                                </button>
                                                {selectedProduct && !selectedProduct.isActive && (
                                                    <span className="order-item-inactive">
                                                        Existing inactive product; price snapshot retained unless changed.
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="order-total">
                                <strong>Order total</strong>
                                <strong>{items.reduce(
                                    (total, item) => total + item.quantity * item.unitPrice,
                                    0
                                ).toFixed(2)}</strong>
                            </div>
                        </div>

                        {error && <div className="dialog-error">{error}</div>}

                        <div className="dialog-actions">
                            <button type="button" onClick={onCancel} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}