import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    AllCommunityModule
} from "ag-grid-community";
import {
    AgGridProvider
} from "ag-grid-react";

import App from "./App";
import "./index.css";

import {
    initializeApi
} from "./api/apiConfig";

async function startApplication() {
    await initializeApi();

    createRoot(
        document.getElementById("root")!
    ).render(
        <StrictMode>
            <AgGridProvider
                modules={[
                    AllCommunityModule
                ]}
            >
                <App />
            </AgGridProvider>
        </StrictMode>
    );
}

startApplication();