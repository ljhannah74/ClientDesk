import {
    Routes,
    Route,
    HashRouter
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Products from "./pages/Products";

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                        path="/customers"
                        element={<Customers />}
                    />
                    <Route
                        path="/orders"
                        element={<Orders />}
                    />
                    <Route
                        path="/products"
                        element={<Products />}
                    />
                </Route>
            </Routes>
        </HashRouter>
    );
}