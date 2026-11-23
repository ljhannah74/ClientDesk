import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { isReadOnlyDemo } from "../demo";

import type {
    ColDef,
    RowSelectionOptions,
    SelectionChangedEvent
} from "ag-grid-community";

import type { Product } from "../types/Product";

import ProductDialog from "../components/ProductDialog";
import {
    createProduct,
    getProducts
} from "../api/productsApi";
import type { CreateProductData } from "../api/productsApi";

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const columnDefs = useMemo<ColDef<Product>[]>(() => [
        {
            field: "sku",
            headerName: "SKU",
            width: 150
        },
        {
            field: "name",
            headerName: "Product Name",
            flex: 1,
            minWidth: 180
        },
        {
            field: "description",
            headerName: "Description",
            flex: 2,
            minWidth: 200
        },
        {
            field: "unitPrice",
            headerName: "Unit Price",
            width: 140,
            valueFormatter: params =>
                params.value == null
                    ? ""
                    : Number(params.value).toLocaleString(
                        "en-US",
                        {
                            style: "currency",
                            currency: "USD"
                        }
                    )
        },
        {
            field: "isActive",
            headerName: "Active",
            width: 120,
            valueFormatter: params =>
                params.value ? "Yes" : "No"
        }
    ], []);

    const defaultColDef = useMemo<ColDef<Product>>(() => ({
        sortable: true,
        filter: true,
        resizable: true
    }), []);

    const rowSelection = useMemo<RowSelectionOptions>(() => ({
        mode: "singleRow",
        checkboxes: false,
        enableClickSelection: true
    }), []);

    async function loadProducts() {
        try {
            setLoading(true);
            setError(null);
            setProducts(await getProducts());
        } catch (err) {
            console.error(err);
            setError("Unable to load products.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadProducts();
    }, []);

    function handleSelectionChanged(
        event: SelectionChangedEvent<Product>
    ) {
        setSelectedProduct(
            event.api.getSelectedRows()[0] ?? null
        );
    }

    async function handleAddProduct(data: CreateProductData) {
    await createProduct(data);
    await loadProducts();
    setAddDialogOpen(false);
}

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>Manage your products.</p>
                </div>

            <div className="page-actions">
                <button type="button"
                    disabled={isReadOnlyDemo}
                    onClick={() => setAddDialogOpen(true)}>
                    Add
                </button>

                <button
                    type="button"
                    disabled={!selectedProduct}
                >
                    Edit
                </button>

                <button
                    type="button"
                    disabled={!selectedProduct}
                >
                    Delete
                </button>
            </div>
            </div>

            {error && <p role="alert">{error}</p>}

            <div className="customers-grid">
                <AgGridReact<Product>
                    rowData={products}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection={rowSelection}
                    onSelectionChanged={handleSelectionChanged}
                    loading={loading}
                    getRowId={params => String(params.data.id)}
                />
            </div>
            <ProductDialog
                open={addDialogOpen}
                onSave={handleAddProduct}
                onCancel={() => setAddDialogOpen(false)}
            />
        </div>
    );
}
