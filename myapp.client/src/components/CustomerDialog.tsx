import { useEffect, useRef, useState } from "react";
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
    const saveInProgress = useRef(false);
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
        if (saveInProgress.current) return;

        if (!name.trim()) {
            setError("Name is required.");
            return;
        }

        if (name.trim().length > 100 || email.trim().length > 254) {
            setError("Name must be 100 characters or fewer and email 254 characters or fewer.");
            return;
        }

        try {
            saveInProgress.current = true;
            setSaving(true);
            setError(null);

            await onSave({
                name: name.trim(),
                email: email.trim() || undefined,
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to save customer.");
        } finally {
            saveInProgress.current = false;
            setSaving(false);
        }
    }

    return (
        <div className="dialog-backdrop">
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title">
                <h2 id="customer-dialog-title">{customer ? "Edit Customer" : "Add Customer"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="customer-name">
                            Name
                        </label>

                        <input
                            id="customer-name"
                            type="text"
                            required
                            maxLength={100}
                            disabled={saving}
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
                            maxLength={254}
                            disabled={saving}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="dialog-error" role="alert">
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
