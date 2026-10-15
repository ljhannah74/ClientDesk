import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
    ColDef,
    RowSelectionOptions,
    SelectionChangedEvent,
} from "ag-grid-community";
import ProductDialog from "../components/ProductDialog";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../api/productsApi";
import type { Product, ProductRequest } from "../types/Product";

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const columnDefs = useMemo<ColDef<Product>[]>(() => [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "sku", headerName: "SKU", width: 180 },
        { field: "description", headerName: "Description", flex: 1 },
        {
            field: "unitPrice",
            headerName: "Unit price",
            width: 150,
            valueFormatter: (params) => params.value == null
                ? ""
                : Number(params.value).toFixed(2),
        },
        {
            field: "isActive",
            headerName: "Status",
            width: 130,
            valueFormatter: (params) => params.value ? "Active" : "Inactive",
        },
    ], []);

    const defaultColDef = useMemo<ColDef<Product>>(() => ({
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
        void loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            setError(null);
            setProducts(await getProducts());
        } catch (loadError) {
            console.error(loadError);
            setError(loadError instanceof Error
                ? loadError.message
                : "Unable to load products.");
        } finally {
            setLoading(false);
        }
    }

    function handleSelectionChanged(event: SelectionChangedEvent<Product>) {
        const selectedRows = event.api.getSelectedRows();
        setSelectedProduct(selectedRows.length > 0 ? selectedRows[0] : null);
    }

    async function handleAddProduct(request: ProductRequest) {
        await createProduct(request);
        setAddDialogOpen(false);
        setSelectedProduct(null);
        await loadProducts();
    }

    async function handleEditProduct(request: ProductRequest) {
        if (!selectedProduct) {
            return;
        }
        await updateProduct(selectedProduct.id, request);
        setEditDialogOpen(false);
        setSelectedProduct(null);
        await loadProducts();
    }

    async function handleDeleteProduct() {
        if (!selectedProduct) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError(null);
            await deleteProduct(selectedProduct.id);
            setDeleteDialogOpen(false);
            setSelectedProduct(null);
            await loadProducts();
        } catch (deleteError) {
            console.error("Unable to delete product:", deleteError);
            setDeleteError(deleteError instanceof Error
                ? deleteError.message
                : "Unable to delete product.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>Manage products and availability.</p>
                </div>
                <div className="page-actions">
                    <button type="button" onClick={() => setAddDialogOpen(true)} disabled={loading}>
                        Add
                    </button>
                    <button
                        type="button"
                        disabled={!selectedProduct}
                        onClick={() => setEditDialogOpen(true)}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        disabled={!selectedProduct}
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
            {!error && products.length === 0 && !loading && (
                <div className="empty-state">No products found.</div>
            )}
            {!error && (products.length > 0 || loading) && (
                <div className="products-grid">
                    <AgGridReact<Product>
                        rowData={products}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        loading={loading}
                        rowSelection={rowSelection}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </div>
            )}

            <ProductDialog
                open={addDialogOpen}
                onSave={handleAddProduct}
                onCancel={() => setAddDialogOpen(false)}
            />
            <ProductDialog
                open={editDialogOpen}
                product={selectedProduct}
                onSave={handleEditProduct}
                onCancel={() => setEditDialogOpen(false)}
            />

            {deleteDialogOpen && selectedProduct && (
                <div className="dialog-backdrop">
                    <div className="dialog">
                        <h2>Delete Product</h2>
                        <p>
                            Delete <strong>{selectedProduct.name}</strong> ({selectedProduct.sku})?
                        </p>
                        {deleteError && <div className="dialog-error">{deleteError}</div>}
                        <div className="dialog-actions">
                            <button
                                type="button"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button type="button" onClick={handleDeleteProduct} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}