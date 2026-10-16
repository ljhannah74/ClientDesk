# ClientDesk — Customer & Order Manager

A full-stack customer and order management application built with React, TypeScript, ASP.NET Core, and SQLite. The project demonstrates relational business workflows, API integration, validation, and recovery from failed requests.

ClientDesk manages customers and their orders in a React interface backed by a C# API. Internal project names and the repository URL still use **MyApp**.

## Features

- Create, edit, list, and delete customers.
- Create, edit, list, and delete orders linked to customers.
- Track order status: New, Processing, Completed, or Cancelled.
- Sort and filter customer and order records with AG Grid.
- Require unique order numbers and valid customer relationships.
- Prevent deleting a customer who still has orders.
- Validate customer names and optional email addresses in the API and form.
- Keep customer form input after failed saves and display useful validation, connection, and deletion-conflict messages.
- Persist records in SQLite, with EF Core migrations applied at startup.
- Run the React interface in a browser, with an additional Electron desktop shell.

### Main Customers Screen

<img width="1365" height="714" alt="Main customers screen" src="https://github.com/user-attachments/assets/17607e07-38e9-40cf-9fb5-48e92416b290" />

### Main Orders Screen

<img width="1345" height="717" alt="Main orders screen" src="https://github.com/user-attachments/assets/b6050fd9-9467-4289-b6b5-dbbde736706d" />

### Edit Customer Dialog

<img width="437" height="307" alt="Dialog for editing a customer" src="https://github.com/user-attachments/assets/2a90b052-1263-4b98-9005-4be88989b73f" />

### Edit Customer Dialog Validation

<img width="531" height="322" alt="Customer editing dialog showing validation feedback" src="https://github.com/user-attachments/assets/267c304a-18ec-4ea5-97ac-7d19c83ee0d4" />

### Create Order Dialog

<img width="420" height="532" alt="Dialog for creating an order" src="https://github.com/user-attachments/assets/cc15cad7-6251-4c0a-90c3-63fb8d4dd33f" />

### Create Order Dialog Validation

<img width="419" height="587" alt="Order creation dialog showing validation feedback" src="https://github.com/user-attachments/assets/7649f9fc-3e90-485c-9c53-43da53ccec72" />


## Technology and architecture

| Layer | Implementation |
| --- | --- |
| Interface | React 19, TypeScript 6, React Router, AG Grid |
| Frontend tooling | Vite 8, npm, Oxlint |
| API | C#, ASP.NET Core targeting .NET 10 |
| Persistence | EF Core 10, SQLite |
| Desktop shell | Electron and electron-builder |

In browser development, React sends JSON requests to relative `/api` URLs. Vite proxies these requests to the API at `http://localhost:5102`. Controllers use `AppDbContext` to access SQLite.

In Electron mode, the desktop process starts the API on an available local port and provides that URL to React through the preload bridge. Electron uses context isolation and disables Node integration in the renderer.

## Repository structures

- `MyApp.Api/Controllers/` — customer and order HTTP endpoints.
- `MyApp.Api/Models/` — entities and validated request models.
- `MyApp.Api/Data/` — EF Core context and relationship configuration.
- `MyApp.Api/Migrations/` — checked-in schema migrations.
- `MyApp.Api.Tests/` — HTTP integration tests with isolated SQLite databases.
- `myapp.client/src/pages/` — dashboard, customer directory, and orders.
- `myapp.client/src/components/` — layout and customer/order dialogs.
- `myapp.client/src/api/` — API initialization and HTTP calls.
- `myapp.client/electron/` — desktop process and preload bridge.
- `run.sh` — Bash helper to start the API and Vite together.

## Run locally on Windows

### Prerequisites

- Git and access to this repository.
- .NET 10 SDK.
- Node.js and npm; Node.js 24 was used for the verified frontend build.

Clone the repository:

```powershell
git clone https://github.com/ljhannah74/MyApp.git
cd MyApp
```

### 1. Start the API

From the repository root, in PowerShell:

```powershell
dotnet restore .\MyApp.Api\MyApp.Api.csproj
dotnet run --project .\MyApp.Api\MyApp.Api.csproj --launch-profile http
```

Keep this terminal open. Customer and order endpoints are available at:

- `http://localhost:5102/api/customers`
- `http://localhost:5102/api/orders`

There is no configured Swagger UI; use the endpoint URLs or an HTTP client to inspect the API.

### 2. Start React

Open a second PowerShell terminal at the repository root:

```powershell
cd .\myapp.client
npm ci
npm run dev
```

Open **http://localhost:5173**. Stop each process with **Ctrl+C**.

If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd run dev`.

Vite expects the API at port 5102. If changing that port, update `myapp.client/vite.config.ts`. Keep Vite on port 5173 for the existing CORS and Electron development configuration.

### Bash alternative

After installing dependencies, Git Bash or a Linux shell can start both processes from the repository root:

```bash
bash ./run.sh
```

The script needs `dotnet` and `npm` on the shell's PATH. PowerShell itself does not execute Bash scripts.

## SQLite storage

The API creates `myapp.db` and applies checked-in migrations automatically. A separate database server is not required.

| Launch mode | Database location |
| --- | --- |
| API launched directly | Application output directory, normally `MyApp.Api/bin/Debug/net10.0/myapp.db` for the development command above |
| Electron development | Repository root's `dev-data/myapp.db` |
| Packaged Electron | The existing `MyApp` folder under Electron's platform-specific application-data directory |

For a directly launched API, set `APP_DATA_PATH` to use a stable location across build configurations:

```powershell
$env:APP_DATA_PATH = Join-Path $env:LOCALAPPDATA "MyApp-Development"
dotnet run --project .\MyApp.Api\MyApp.Api.csproj --launch-profile http
```

Set this in the API terminal before launch. Electron sets its own data path. Browser and Electron modes use different databases by default, so their record lists may differ.

The ClientDesk display-name change preserves the existing `MyApp` desktop data folder, `dev-data/`, and `myapp.db` filename. No database migration or copying is required.

Database files and `dev-data/` are ignored by Git. Back up the database before changing its schema; startup migrations are intended for local development.

## Electron development

Browser mode is the simplest verified starting point. To try the desktop shell on Windows:

1. Stop the directly launched API.
2. Leave Vite running with `npm run dev`.
3. Open another terminal in `myapp.client/` and run:

```powershell
npm run electron
```

Electron starts its own API process. The combined `electron:dev` script currently contains a Linux/X11-specific command; use the separate commands above on Windows.

The repository includes packaging configuration, but building installers also requires publishing the matching API executable into `publish/api/`. Packaged installers and cross-platform desktop behavior have not been verified.

## Try the business workflow

Use fictional data, such as Alex Example and `alex@example.com`.

1. Create a customer, then edit the name.
2. Try a blank name and malformed email; confirm that validation prevents saving.
3. Create an order for the customer with a unique order number.
4. Edit the order's status.
5. Try deleting the customer; the application should explain that the customer has orders.
6. Delete the order, then delete the customer.
7. Create another record and restart the API; confirm that the record persists.
8. Stop the API while a customer form is open and attempt to save. The form should retain its input and display a connection error. Restart the API and retry.

## API overview

Both `/api/customers` and `/api/orders` support:

| Method | Route suffix | Purpose |
| --- | --- | --- |
| GET | none | List records |
| GET | `/{id}` | Retrieve one record |
| POST | none | Create a record |
| PUT | `/{id}` | Update a record |
| DELETE | `/{id}` | Delete a record |

Orders also support `GET /api/orders?customerId={id}`.

Customer requests contain `name` and optional `email`. Name is required and limited to 100 characters; email is limited to 254 characters. IDs and order relationships are server-managed.

Order requests contain `orderNumber`, `orderDate`, `customerId`, optional `description`, and `status`. Order numbers are limited to 50 characters, descriptions to 500. The customer must exist. Duplicate order numbers and attempts to delete customers with orders return HTTP 409.

## Build and verification

From the repository root:

```powershell
dotnet build .\MyApp.Api\MyApp.Api.csproj --configuration Release
cd .\myapp.client
npm ci
npm run build
npm run lint
```

Verification completed for the customer-validation update:

- .NET Release build passed with no warnings or errors.
- React/TypeScript production build passed with a large-bundle warning.
- Lint completed with three warnings involving unused Electron variables and customer form state initialization.
- Live API checks against a fresh temporary SQLite database passed customer validation, valid/invalid updates, server-managed IDs and relationships, and deletion protection.
- Frontend API checks passed error-message handling and successful retrieval.
- Manual browser checks for customer validation, editing, deletion protection, and recovery from a failed save passed.

### Automated tests

From the repository root:

```powershell
dotnet test .\MyApp.Api.Tests\MyApp.Api.Tests.csproj --configuration Release
cd .\myapp.client
npm ci
npm test
```

Use `npm run test:watch` for interactive frontend test runs.

The xUnit integration tests exercise the HTTP API, ASP.NET Core validation, migrations, and SQLite relationships using a fresh temporary database for each test case. They cover required fields, length/email constraints, normalization, invalid updates, server-managed IDs/relationships, duplicate order numbers, and deletion protection. Test hosts override `APP_DATA_PATH` without changing your environment or development database.

Vitest and React Testing Library cover customer form headings, validation, trimmed submissions, save failures/retries, duplicate-save prevention, and customer API error handling. These use jsdom and mocked requests; they are not end-to-end browser or Electron tests.

### GitHub Actions

[![CI](https://github.com/ljhannah74/MyApp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ljhannah74/MyApp/actions/workflows/ci.yml)

CI runs on pull requests targeting `main`, pushes to `main`, and manual runs. Separate jobs build/test the .NET 10 API and test/build/lint React with Node.js 24. The workflow needs no secrets or database server. Jobs use read-only repository access, time limits, and cancellation of superseded runs.

Inspect results under **Actions → CI** or the pull request's **Checks** tab. Lint warnings remain visible without failing the current configuration. Branch rules requiring successful checks are not configured by this workflow.

## Current limitations and next steps

This is a local development and portfolio project. Authentication and authorization are not implemented; use fictional records.

Next improvements are broader order UI and end-to-end tests, refreshed screenshots showing ClientDesk branding, improved order error classification, and verified Electron packaging. Order database-update failures currently share a duplicate-order-number response, and concurrent changes need more robust handling.

