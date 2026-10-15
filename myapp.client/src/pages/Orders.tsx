import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
    ColDef,
    RowSelectionOptions,
    SelectionChangedEvent,
} from "ag-grid-community";
import OrderDialog from "../components/OrderDialog";
import { createOrder, deleteOrder, getOrders, updateOrder } from "../api/ordersApi";
import { getCustomers } from "../api/customersApi";
import { getProducts } from "../api/productsApi";
import type { Customer } from "../types/Customer";
import type { Product } from "../types/Product";
import type { Order, OrderRequest } from "../types/Order";

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const customerNames = useMemo(
        () => new Map(customers.map((customer) => [customer.id, customer.name])),
        [customers]
    );

    const columnDefs = useMemo<ColDef<Order>[]>(() => [
        { field: "orderNumber", headerName: "Order number", flex: 1 },
        {
            field: "orderDate",
            headerName: "Order date",
            flex: 1,
            valueFormatter: (params) => params.value
                ? new Date(params.value).toLocaleString()
                : "",
        },
        {
            headerName: "Customer",
            flex: 1,
            valueGetter: (params) => params.data
                ? customerNames.get(params.data.customerId) ?? "Unknown customer"
                : "",
        },
        {
            headerName: "Lines",
            width: 110,
            valueGetter: (params) => params.data?.items.length ?? 0,
        },
        {
            field: "total",
            headerName: "Total",
            width: 140,
            valueFormatter: (params) => Number(params.value ?? 0).toFixed(2),
        },
        { field: "status", headerName: "Status", width: 150 },
    ], [customerNames]);

    const defaultColDef = useMemo<ColDef<Order>>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
    }), []);

    const rowSelection = useMemo<RowSelectionOptions>(() => ({
        mode: "singleRow",
        checkboxes: false,
        enableClickSelection: true,
    }), []);

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError(null);
            const [orderData, customerData, productData] = await Promise.all([
                getOrders(),
                getCustomers(),
                getProducts(),
            ]);
            setOrders(orderData);
            setCustomers(customerData);
            setProducts(productData);
        } catch (loadError) {
            console.error(loadError);
            setError(loadError instanceof Error
                ? loadError.message
                : "Unable to load orders.");
        } finally {
            setLoading(false);
        }
    }

    function handleSelectionChanged(event: SelectionChangedEvent<Order>) {
        const selectedRows = event.api.getSelectedRows();
        setSelectedOrder(selectedRows.length > 0 ? selectedRows[0] : null);
    }

    async function handleAddOrder(request: OrderRequest) {
        await createOrder(request);
        setAddDialogOpen(false);
        setSelectedOrder(null);
        await loadData();
    }

    async function handleEditOrder(request: OrderRequest) {
        if (!selectedOrder) {
            return;
        }

        await updateOrder(selectedOrder.id, request);
        setEditDialogOpen(false);
        setSelectedOrder(null);
        await loadData();
    }

    async function handleDeleteOrder() {
        if (!selectedOrder) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError(null);
            await deleteOrder(selectedOrder.id);
            setDeleteDialogOpen(false);
            setSelectedOrder(null);
            await loadData();
        } catch (deleteLoadError) {
            console.error("Unable to delete order:", deleteLoadError);
            setDeleteError(deleteLoadError instanceof Error
                ? deleteLoadError.message
                : "Unable to delete order.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="orders-page">
            <div className="page-header">
                <div>
                    <h1>Orders</h1>
                    <p>Manage orders and their customers.</p>
                </div>
                <div className="page-actions">
                    <button
                        type="button"
                        onClick={() => setAddDialogOpen(true)}
                        disabled={loading || customers.length === 0}
                        title={customers.length === 0 ? "Add a customer first" : undefined}
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        disabled={!selectedOrder}
                        onClick={() => setEditDialogOpen(true)}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        disabled={!selectedOrder}
                        onClick={() => {
                            setDeleteError(null);
                            setDeleteDialogOpen(true);
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!error && orders.length === 0 && !loading && (
                <div className="empty-state">No orders found.</div>
            )}

            {!error && (orders.length > 0 || loading) && (
                <div className="orders-grid">
                    <AgGridReact<Order>
                        rowData={orders}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        loading={loading}
                        rowSelection={rowSelection}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </div>
            )}

            <OrderDialog
                open={addDialogOpen}
                customers={customers}
                products={products}
                onSave={handleAddOrder}
                onCancel={() => setAddDialogOpen(false)}
            />
            <OrderDialog
                open={editDialogOpen}
                customers={customers}
                products={products}
                order={selectedOrder}
                onSave={handleEditOrder}
                onCancel={() => setEditDialogOpen(false)}
            />

            {deleteDialogOpen && selectedOrder && (
                <div className="dialog-backdrop">
                    <div className="dialog">
                        <h2>Delete Order</h2>
                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{selectedOrder.orderNumber}</strong>?
                        </p>
                        <p>This action cannot be undone.</p>
                        {deleteError && (
                            <div className="dialog-error">{deleteError}</div>
                        )}
                        <div className="dialog-actions">
                            <button
                                type="button"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteOrder}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}