import { useState } from "react";
import type { Customer } from "../types/Customer";
import type { Order, OrderRequest, OrderStatus } from "../types/Order";

interface OrderDialogProps {
    open: boolean;
    customers: Customer[];
    order?: Order | null;
    onSave: (request: OrderRequest) => Promise<void>;
    onCancel: () => void;
}

type OrderDialogFormProps = Omit<OrderDialogProps, "open">;

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

        try {
            setSaving(true);
            setError(null);

            await onSave({
                orderNumber: orderNumber.trim(),
                orderDate: new Date(orderDate).toISOString(),
                customerId: Number(customerId),
                description: description.trim() || null,
                status,
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
            <div className="dialog">
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