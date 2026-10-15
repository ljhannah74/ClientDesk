import { useState } from "react";
import type { Product, ProductRequest } from "../types/Product";

interface ProductDialogProps {
    open: boolean;
    product?: Product | null;
    onSave: (request: ProductRequest) => Promise<void>;
    onCancel: () => void;
}

type ProductDialogFormProps = Omit<ProductDialogProps, "open">;

export default function ProductDialog({
    open,
    ...props
}: ProductDialogProps) {
    if (!open) {
        return null;
    }

    return (
        <ProductDialogForm
            key={props.product?.id ?? "new"}
            {...props}
        />
    );
}

function ProductDialogForm({
    product,
    onSave,
    onCancel,
}: ProductDialogFormProps) {
    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [sku, setSku] = useState(product?.sku ?? "");
    const [unitPrice, setUnitPrice] = useState(product?.unitPrice.toFixed(2) ?? "0.00");
    const [isActive, setIsActive] = useState(product?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const parsedPrice = Number(unitPrice);
        if (!name.trim()) {
            setError("Name is required.");
            return;
        }
        if (!sku.trim()) {
            setError("SKU is required.");
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0
            || !/^\d+(\.\d{1,2})?$/.test(unitPrice.trim())) {
            setError("Unit price must be non-negative with at most two decimal places.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await onSave({
                name: name.trim(),
                description: description.trim() || null,
                sku: sku.trim(),
                unitPrice: parsedPrice,
                isActive,
            });
        } catch (saveError) {
            console.error(saveError);
            setError(saveError instanceof Error
                ? saveError.message
                : "Unable to save product.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dialog-backdrop">
            <div className="dialog">
                <h2>{product ? "Edit Product" : "Add Product"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="product-name">Name</label>
                        <input
                            id="product-name"
                            type="text"
                            maxLength={200}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="product-sku">SKU</label>
                        <input
                            id="product-sku"
                            type="text"
                            maxLength={64}
                            value={sku}
                            onChange={(event) => setSku(event.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="product-description">Description</label>
                        <input
                            id="product-description"
                            type="text"
                            maxLength={1000}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="product-unit-price">Unit price</label>
                        <input
                            id="product-unit-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={unitPrice}
                            onChange={(event) => setUnitPrice(event.target.value)}
                        />
                    </div>

                    <label className="check-field" htmlFor="product-active">
                        <input
                            id="product-active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                        />
                        Active
                    </label>

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
            </div>
        </div>
    );
}