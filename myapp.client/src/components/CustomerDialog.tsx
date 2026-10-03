import { useEffect, useState } from "react";
import type { Customer } from "../types/Customer";

interface CustomerDialogProps {
    open: boolean;
    customer?: Customer | null;
    onSave: (customer: Omit<Customer, "id">) => Promise<void>;
    onCancel: () => void;
}

export interface CustomerFormData {
    name: string;
    email?: string;
}

export default function CustomerDialog({
    open,
    customer,
    onSave,
    onCancel,
}: CustomerDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(customer?.name ?? "");
            setEmail(customer?.email ?? "");
            setError(null);
        }
    }, [open, customer]);

    if (!open) {
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            setError("Name is required.");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await onSave({
                name: name.trim(),
                email: email.trim() || undefined,
            });
        } catch (err) {
            console.error(err);
            setError("Unable to save customer.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dialog-backdrop">
            <div className="dialog">
                <h2>Add Customer</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="customer-name">
                            Name
                        </label>

                        <input
                            id="customer-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="customer-email">
                            Email
                        </label>

                        <input
                            id="customer-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="dialog-error">
                            {error}
                        </div>
                    )}

                    <div className="dialog-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}