## Plan: Orders navigation and grid

Add an Orders area to the client with full CRUD. Orders will be assigned to existing customers in the form, and the grid will show each customer’s name.

**Steps**
1. Add an Order type and request type matching the existing backend contract.
2. Add typed order API methods for list, create, update, and delete. Preserve response details for errors such as duplicate order numbers.
3. Add an order dialog following the existing customer dialog, with order number, date/time, customer selector, description, and the backend’s allowed statuses. Convert the selected local date/time to UTC when submitting. Handle the case where there are no customers.
4. Add an Orders page following the Customers page pattern: AG Grid columns for order number, date, customer, description, and status; row selection; Add/Edit/Delete actions; loading, error, empty, and delete-confirmation states. Resolve customer names from the loaded customer list using each order’s `customerId`.
5. Add the `/orders` route and an Orders link in the sidebar.
6. Reuse existing layout and dialog styles, adding CSS only where needed. No backend changes or new dependencies are expected.

**Relevant files**
- `myapp.client/src/App.tsx` — register the Orders route.
- `myapp.client/src/components/Sidebar.tsx` — add Orders navigation.
- `myapp.client/src/pages/Orders.tsx` — grid and CRUD page.
- `myapp.client/src/components/OrderDialog.tsx` — create/edit form.
- `myapp.client/src/api/ordersApi.ts` and `myapp.client/src/types/Order.ts` — API and types.
- `myapp.client/src/index.css` — only necessary Orders-specific styling.

**Verification**
1. Run `npm run build` and `npm run lint` from `myapp.client`.
2. Run the app with the backend and verify navigation, customer names, and customer selection.
3. Exercise create, edit, customer reassignment, and delete. Check duplicate order number, invalid/missing customer or date, and the no-customers state.
4. Confirm Dashboard navigation and existing Customers CRUD still work.

**Decisions**
- “Connecting to Customers” means selecting an existing customer when creating/editing an order and displaying that customer’s name in the grid. No customer filter or navigation from customer rows is included.
- Full Orders CRUD is in scope; backend changes and customer-order detail navigation are out of scope.
- The plan is saved in session memory.
