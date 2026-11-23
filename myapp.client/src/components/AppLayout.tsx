import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";
import StatusBar from "./StatusBar";
import { isReadOnlyDemo } from "../demo";

export default function AppLayout() {
    return (
        <div className="app">
            <Sidebar />

            <div className="main">
                <Toolbar />

                <main className="content">
                    {isReadOnlyDemo && (
                        <div className="demo-banner" role="note">
                            <strong>Read-only demo.</strong>{" "}
                            Explore sample data using sorting and filters.
                            Adding, editing, and deleting are disabled.
                        </div>
                    )}
                    <Outlet />
                </main>

                <StatusBar />
            </div>
        </div>
    );
}