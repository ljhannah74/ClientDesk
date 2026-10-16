import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowSelectionOptions, SelectionChangedEvent } from "ag-grid-community";
import CustomerDialog, { type CustomerFormData } from "../components/CustomerDialog";

import { createCustomer, getCustomers, updateCustomer, deleteCustomer } from "../api/customersApi";
import type { Customer } from "../types/Customer";

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] =
        useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState<string | null>(null);

    const columnDefs = useMemo<ColDef<Customer>[]>(() => [
        {
            field: "name",
            headerName: "Name",
            flex: 1,
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
        },
    ], []);

    const defaultColDef = useMemo<ColDef<Customer>>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
    }), []);

    const rowSelection = useMemo<RowSelectionOptions>(
        () => ({
            mode: "singleRow",
            checkboxes: false,
            enableClickSelection: true,
        }),
        []
    );

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            setLoading(true);
            setError(null);

            const data = await getCustomers();

            setCustomers(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to load customers.");
        } finally {
            setLoading(false);
        }
    }

    function handleSelectionChanged(event: SelectionChangedEvent<Customer>) {
        const selectedRows = event.api.getSelectedRows();
        setSelectedCustomer(selectedRows.length > 0 ? selectedRows[0] : null);
    }

    async function handleAddCustomer(
        customer: Omit<Customer, "id">
    ) {
        await createCustomer(customer);

        setAddDialogOpen(false);

        await loadCustomers();
    }

    async function handleEditCustomer(
        data: CustomerFormData
    ) {
        if (!selectedCustomer) {
            return;
        }

        await updateCustomer({
            ...selectedCustomer,
            ...data,
        });

        setEditDialogOpen(false);

        await loadCustomers();

        setSelectedCustomer(null);
    }

    async function handleDeleteCustomer() {
        if (!selectedCustomer) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError(null);

            await deleteCustomer(
                selectedCustomer.id
            );

            setDeleteDialogOpen(false);
            setSelectedCustomer(null);

            await loadCustomers();
        } catch (error) {
            console.error(
                "Unable to delete customer:",
                error
            );

            setDeleteError(
                error instanceof Error ? error.message : "Unable to delete customer."
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="customers-page">
            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>Manage your customers.</p>
                </div>

                <button type="button"
                    onClick={() => setAddDialogOpen(true)}
                >
                    Add
                </button>

                <button type="button" disabled={!selectedCustomer}
                    onClick={() => setEditDialogOpen(true)}>
                    Edit
                </button>

                <button type="button" disabled={!selectedCustomer}
                    onClick={() => {
                        setDeleteError(null);
                        setDeleteDialogOpen(true);
                    }}>
                    Delete
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {!error && (
                <div className="customers-grid">
                    <AgGridReact<Customer>
                        rowData={customers}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        loading={loading}
                        rowSelection={rowSelection}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </div>
            )}
            <CustomerDialog
                open={addDialogOpen}
                onSave={handleAddCustomer}
                onCancel={() => setAddDialogOpen(false)}
            />
            <CustomerDialog
                open={editDialogOpen}
                customer={selectedCustomer}
                onSave={handleEditCustomer}
                onCancel={() =>
                    setEditDialogOpen(false)
                }
            />
            {deleteDialogOpen && selectedCustomer && (
                <div className="dialog-backdrop">
                    <div className="dialog">
                        <h2>Delete Customer</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {selectedCustomer.name}
                            </strong>
                            ?
                        </p>

                        <p>
                            This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="dialog-error" role="alert">
                                {deleteError}
                            </div>
                        )}

                        <div className="dialog-actions">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteDialogOpen(false)
                                }
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteCustomer}
                                disabled={deleting}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
