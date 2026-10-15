## Plan: Products and OrderItems

Build Products independently and validate its API before adding the screen. Then add OrderItems to preserve product pricing on orders and manage lines in the existing order workflow. The plan is saved in session memory.

**Phase 1: Product Model, Migration, and API**
1. Add `MyApp.Api/Models/Product.cs`: `Id`, required `Name`, optional `Description`, required unique `Sku`, non-negative `UnitPrice` with two-decimal precision, and `IsActive` defaulting to `true`. Proposed length limits: Name 200, SKU 64, Description 1000.
2. Add `DbSet<Product>` and configure lengths, price precision, and unique SKU index in `MyApp.Api/Data/AppDbContext.cs`.
3. Add Product request/response DTOs, an `IProductService`/`ProductService`, and `ProductsController`, following the existing controller style. Provide list, get, create, update, and delete; include cancellation tokens; return appropriate 400, 404, 201, and 204 responses, and 409 for duplicate SKU.
4. Wire built-in OpenAPI support in `MyApp.Api/Program.cs` using the package already referenced by the project. Document the Product endpoints and use Problem Details for new Product API errors without unnecessarily changing existing endpoint contracts.
5. Generate an `AddProducts` migration; review its `Up`/`Down` and the updated model snapshot. Add realistic Product requests to `MyApp.Api/MyApp.Api.http`.
6. **Gate before UI:** run `dotnet build`; apply the migration to an isolated SQLite data path; exercise CRUD, duplicate SKU and invalid-field responses; check OpenAPI and confirm existing Customer and Order endpoints still work.

**Phase 2: Products Screen**
1. Add client Product types and `productsApi.ts` matching the API contracts and preserving useful validation/conflict messages.
2. Add `Products.tsx` and `ProductDialog.tsx`, following the existing Orders UI: AG Grid columns for name, SKU, description, price, and active state; selection-driven Add/Edit/Delete; validation; and loading, error, empty, and delete-confirmation states.
3. Register `/products` in `myapp.client/src/App.tsx`, add Products navigation in `Sidebar.tsx`, and reuse shared styles in `index.css`. Show inactive products in the grid so they remain manageable.
4. **Gate before OrderItems:** run `npm run build` and `npm run lint`; exercise Product CRUD and validation in the running client against the API.

**Phase 3: OrderItems and Order Integration**
1. Add `MyApp.Api/Models/OrderItem.cs` with `Id`, `OrderId`, `ProductId`, positive whole-number `Quantity`, snapshot `UnitPrice`, and a calculated, non-persisted `LineTotal`. Add navigations and `DbSet<OrderItem>`; configure cascade deletion from Order to items and restrict Product deletion when referenced.
2. Generate a separate `AddOrderItems` migration after `AddProducts` and review its migration and snapshot.
3. Extend the Orders API so create/update can save order lines atomically. Clients send `ProductId` and `Quantity`; the server assigns the current product price when a line is added or its product changes, and preserves the snapshot when only quantity changes. Return calculated line totals and order total.
4. Update the order form and grid to add/remove lines, select active products for new lines, edit quantities, and display calculated totals. Preserve and display existing lines if their products are later deactivated.
5. **Final gate:** run API build, client build, and lint; apply both migrations to a scratch database; verify line quantities, price snapshots, totals, product deletion conflicts, and existing Customer/Order workflows.

**Decisions**
- SKU is required and unique; price is non-negative with two-decimal precision; `IsActive` defaults to true.
- Products can be deactivated. Deleting a product referenced by an OrderItem returns 409; inactive products remain visible but cannot be newly added to orders.
- Quantity is a positive integer. `UnitPrice` is a server-assigned snapshot. Line and order totals are calculated, not persisted.
- OrderItems are edited inside the existing order add/edit flow, not a separate detail page.
- Use the current SQLite, EF migration, ASP.NET controller, and AG Grid patterns. No new frontend dependencies; verification uses builds and `.http`/running-app checks because the repo has no test project.

**Key Files**
- Backend: `MyApp.Api/Models/Product.cs`, `MyApp.Api/Models/OrderItem.cs`, `MyApp.Api/Models/Order.cs`, `MyApp.Api/Data/AppDbContext.cs`, Product and Order controllers/services/DTOs, `MyApp.Api/Program.cs`, migrations, `MyApp.Api/MyApp.Api.http`.
- Frontend: `myapp.client/src/pages/Products.tsx`, `myapp.client/src/components/ProductDialog.tsx`, Product API/types, `myapp.client/src/pages/Orders.tsx`, `myapp.client/src/components/OrderDialog.tsx`, `myapp.client/src/App.tsx`, `myapp.client/src/components/Sidebar.tsx`, `myapp.client/src/index.css`.
