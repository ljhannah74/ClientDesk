import { useState } from "react";
import type { FormEvent } from "react";
import type { CreateProductData } from "../api/productsApi";

interface ProductDialogProps {
    open: boolean;
    onSave: (product: CreateProductData) => Promise<void>;
    onCancel: () => void;
}

export default function ProductDialog({
    open,
    onSave,
    onCancel
}: ProductDialogProps) {
    const [sku, setSku] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const price = Number(unitPrice);

        if (!sku.trim() || !name.trim()) {
            setError("SKU and product name are required.");
            return;
        }

        if (
            !unitPrice.trim() ||
            !Number.isFinite(price) ||
            price < 0 ||
            !/^\d+(\.\d{1,2})?$/.test(unitPrice.trim())
        ) {
            setError("Enter a valid nonnegative price with at most two decimal places.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await onSave({
                sku: sku.trim(),
                name: name.trim(),
                description: description.trim() || null,
                unitPrice: price,
                isActive
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save product."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dialog-backdrop">
            <div className="dialog">
                <h2>Add Product</h2>

                <form onSubmit={handleSubmit}>
                    <div className="product-form-grid">
                        <label htmlFor="product-sku">SKU</label>
                        <input
                            id="product-sku"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                            required
                        />

                        <label htmlFor="product-name">Product Name</label>
                        <input
                            id="product-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />

                        <label htmlFor="product-description">Description</label>
                        <textarea
                            id="product-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                        />

                        <label htmlFor="product-price">Unit Price</label>
                        <input
                            id="product-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={unitPrice}
                            onChange={e => setUnitPrice(e.target.value)}
                            required
                        />

                        <label htmlFor="product-active">Active</label>
                        <div className="product-active-field">
                            <input
                                id="product-active"
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                        </div>
                    </div>

                    {error && <p role="alert">{error}</p>}

                    <div className="dialog-actions">
                        <button type="button" onClick={onCancel} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}