const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");

// Keep existing packaged data accessible when the display name changes.
app.setPath("userData", path.join(app.getPath("appData"), "MyApp"));
app.setName("ClientDesk");

app.commandLine.appendSwitch(
    "disable-features",
    "Vulkan"
);

let mainWindow;
let apiProcess;

let apiUrl = null;

function findAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.unref();

        server.on("error", reject);

        server.listen(0, "127.0.0.1", () => {
            const address = server.address();

            if (
                !address ||
                typeof address === "string"
            ) {
                server.close();
                reject(
                    new Error(
                        "Unable to determine available port."
                    )
                );
                return;
            }

            const port = address.port;

            server.close(() => {
                resolve(port);
            });
        });
    });
}

function getApiExecutable() {
    if (!app.isPackaged) {
        return null;
    }

    const executable =
        process.platform === "win32"
            ? "MyApp.Api.exe"
            : "MyApp.Api";

    return path.join(
        process.resourcesPath,
        "api",
        executable
    );
}

function startApi(apiUrl) {
    const dataDirectory = app.isPackaged
        ? app.getPath("userData")
        : path.join(__dirname, "../../dev-data");

    let command;
    let args;
    let cwd;

    if (app.isPackaged) {
        command = getApiExecutable();
        args = [];
        cwd = path.dirname(command);

        if (!fs.existsSync(command)) {
            throw new Error(
                `API executable not found: ${command}`
            );
        }
    } else {
        command = "dotnet";

        const projectPath = path.join(
            __dirname,
            "../../MyApp.Api/MyApp.Api.csproj"
        );

        args = [
            "run",
            "--project",
            projectPath,
            "--no-launch-profile"
        ];

        cwd = path.join(
            __dirname,
            "../.."
        );
    }

    apiProcess = spawn(command, args, {
        cwd,

        env: {
            ...process.env,
            ASPNETCORE_URLS: apiUrl,
            APP_DATA_PATH: dataDirectory,
        },

        stdio: "pipe",
    });

    apiProcess.on("error", error => {
        console.error(
            "Failed to start API:",
            error
        );
    });

    apiProcess.on("exit", () => {
        apiProcess = null;
    });
}

async function waitForApi(apiUrl) {
    for (
        let attempt = 0;
        attempt < 50;
        attempt++
    ) {
        try {
            const response = await fetch(
                `${apiUrl}/api/customers`
            );

            if (response.ok) {
                return;
            }
        } catch {
            // API hasn't started yet.
        }

        await new Promise(resolve =>
            setTimeout(resolve, 200)
        );
    }

    throw new Error(
        "API failed to start."
    );
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        title: "ClientDesk",
        width: 1280,
        height: 800,

        minWidth: 900,
        minHeight: 600,

        show: true,

        webPreferences: {
            preload: path.join(
                __dirname,
                "preload.cjs"
            ),

            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (app.isPackaged) {
        await mainWindow.loadFile(
            path.join(__dirname, "../dist/index.html")
        );
    } else {
        await mainWindow.loadURL(
            "http://localhost:5173"
        );

        mainWindow.webContents.openDevTools();
    }

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });
}

ipcMain.handle(
    "get-api-url",
    () => {
        

        return apiUrl;
    }
);

app.whenReady().then(async () => {
    try {
        const port = await findAvailablePort();

        apiUrl = `http://127.0.0.1:${port}`;

        startApi(apiUrl);

        await waitForApi(apiUrl);


        await createWindow();
    } catch (error) {
        console.error(
            "Electron startup failed:",
            error
        );

        app.quit();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", () => {
    if (apiProcess) {
        apiProcess.kill();
        apiProcess = null;
    }
});