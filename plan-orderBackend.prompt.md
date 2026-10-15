## Plan: Order backend (model, DbContext, controller, migration)

The `Order` model already exists but isn't registered in `AppDbContext`, and there is no controller or migration. The plan follows the existing `Customer` pattern.

**Steps**
1. Update [MyApp.Api/Models/Order.cs](MyApp.Api/Models/Order.cs). Initialise `OrderNumber` to `string.Empty`. Make `Customer` nullable so clients don't have to send it on create or update.
   - Add `[Required]` and `[StringLength(50)]` on `OrderNumber`, and `[StringLength(500)]` on `Description`.
   - Validate `Status` against an allowed set (`New`, `Processing`, `Completed`, `Cancelled`) and reject a default `OrderDate`.
   - Store `OrderDate` as UTC; SQLite keeps `DateTime` as text with no time zone.
2. *Depends on 1.* Update [MyApp.Api/Data/AppDbContext.cs](MyApp.Api/Data/AppDbContext.cs).
   - Add `DbSet<Order> Orders`.
   - Add `OnModelCreating` with a required `OrderNumber` (max length) and a unique index on it.
   - Configure the `Customer` → `Orders` foreign key with `DeleteBehavior.Restrict`, so deleting a customer with orders is blocked rather than silently cascading.
3. *Depends on 2.* Create `MyApp.Api/Controllers/OrdersController.cs`, mirroring [CustomersController.cs](MyApp.Api/Controllers/CustomersController.cs).
   - Use `AsNoTracking()` on the `GET` queries.
   - `GET` supports an optional `customerId` filter, ordered by `OrderDate` descending.
   - `GET {id}`.
   - `POST` and `PUT` return `BadRequest` if the `CustomerId` doesn't exist.
   - `POST` and `PUT` return `409 Conflict` if the `OrderNumber` already exists on another order (pre-check, plus a catch of `DbUpdateException` for races).
   - `POST` and `PUT` bind to request DTOs (`OrderRequest`) so clients can't over-post `Id` or `Customer`; responses return the `Order`.
   - `PUT` updates `OrderNumber`, `OrderDate`, `CustomerId`, `Description` and `Status`.
   - `DELETE`.
   - Update `CustomersController.Delete` to return `409 Conflict` when the customer still has orders.
4. *Parallel with 3.* In [MyApp.Api/Program.cs](MyApp.Api/Program.cs), configure JSON with `ReferenceHandler.IgnoreCycles`. This is a safeguard in case `Order.Customer` is ever `Include`d, since `Customer.Orders` and `Order.Customer` would otherwise cause serialization cycles.
5. *Depends on 2.* Run `dotnet ef migrations add AddOrders` in `MyApp.Api`. Review the generated `Up` and `Down` and the regenerated `AppDbContextModelSnapshot.cs` and `.Designer.cs` before committing. `db.Database.Migrate()` already runs at startup, so the table is created automatically.

**Verification**
1. Run `dotnet build` on `MyApp.Api`.
2. Check that the migration creates an `Orders` table with a foreign key to `Customers` and a unique index on `OrderNumber`.
3. Run the app against a copy of the existing `dev-data` database, not only a fresh one, and confirm the existing customers survive the migration.
4. Add requests to [MyApp.Api.http](MyApp.Api/MyApp.Api.http) and test create, list, update and delete. Also test a duplicate `OrderNumber` (expect 409), a nonexistent `CustomerId` (expect 400), an invalid `Status`, and deleting a customer that has orders (expect 409).

**Decisions**
- The frontend (`myapp.client`) is out of scope.
- `Status` stays a string column, defaulting to "New", but is validated against an allowed set in the controller.
- There is no test project in the repo, so verification is manual via build and `.http` requests. Adding one is out of scope.
- `publish/api` is a stale build and is not regenerated as part of this work.
- DTOs are used for `Order` only. `CustomersController` keeps binding the entity.
