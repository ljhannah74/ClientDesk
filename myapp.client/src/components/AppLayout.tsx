import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";
import StatusBar from "./StatusBar";

export default function AppLayout() {
    return (
        <div className="app">
            <Sidebar />

            <div className="main">
                <Toolbar />

                <main className="content">
                    <Outlet />
                </main>

                <StatusBar />
            </div>
        </div>
    );
}