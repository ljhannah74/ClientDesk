using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Models;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OrderResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> Get(
        [FromQuery] int? customerId,
        CancellationToken cancellationToken)
    {
        var query = context.Orders.AsNoTracking();

        if (customerId.HasValue)
        {
            query = query.Where(order => order.CustomerId == customerId.Value);
        }

        var orders = await query
            .Include(order => order.Items)
            .ThenInclude(item => item.Product)
            .OrderByDescending(order => order.OrderDate)
            .ToListAsync(cancellationToken);

        return Ok(orders.Select(ToResponse).ToList());
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderResponse>> Get(
        int id,
        CancellationToken cancellationToken)
    {
        var order = await context.Orders
            .AsNoTracking()
            .Include(value => value.Items)
            .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(value => value.Id == id, cancellationToken);

        return order is null
            ? Problem(title: "Order not found.", statusCode: StatusCodes.Status404NotFound)
            : Ok(ToResponse(order));
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderResponse>> Create(
        OrderRequest request,
        CancellationToken cancellationToken)
    {
        var error = await ValidateAsync(request, null, cancellationToken);
        if (error is not null)
        {
            return error;
        }

        var order = new Order();
        Apply(order, request);

        var lineError = await ApplyItemsAsync(
            order,
            request.Items ?? [],
            isNew: true,
            cancellationToken);
        if (lineError is not null)
        {
            return BadRequest(lineError);
        }

        context.Orders.Add(order);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(OrderNumberTaken());
        }

        return CreatedAtAction(
            nameof(Get),
            new { id = order.Id },
            ToResponse(order));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        OrderRequest request,
        CancellationToken cancellationToken)
    {
        var order = await context.Orders
            .Include(value => value.Items)
            .ThenInclude(item => item.Product)
            .FirstOrDefaultAsync(value => value.Id == id, cancellationToken);

        if (order is null)
        {
            return Problem(title: "Order not found.", statusCode: StatusCodes.Status404NotFound);
        }

        var error = await ValidateAsync(request, id, cancellationToken);
        if (error is not null)
        {
            return error;
        }

        if (request.Items is not null)
        {
            var lineError = await ApplyItemsAsync(
                order,
                request.Items,
                isNew: false,
                cancellationToken);
            if (lineError is not null)
            {
                return BadRequest(lineError);
            }
        }

        Apply(order, request);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(OrderNumberTaken());
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var order = await context.Orders
            .FirstOrDefaultAsync(value => value.Id == id, cancellationToken);

        if (order is null)
        {
            return Problem(title: "Order not found.", statusCode: StatusCodes.Status404NotFound);
        }

        context.Orders.Remove(order);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult?> ValidateAsync(
        OrderRequest request,
        int? existingId,
        CancellationToken cancellationToken)
    {
        if (request.OrderDate == default)
        {
            return BadRequest("OrderDate is required.");
        }

        if (!await context.Customers.AnyAsync(
            customer => customer.Id == request.CustomerId,
            cancellationToken))
        {
            return BadRequest("CustomerId does not exist.");
        }

        var taken = await context.Orders.AnyAsync(order =>
            order.OrderNumber == request.OrderNumber && order.Id != existingId,
            cancellationToken);

        return taken ? Conflict(OrderNumberTaken()) : null;
    }

    private async Task<string?> ApplyItemsAsync(
        Order order,
        IReadOnlyList<OrderItemRequest> requests,
        bool isNew,
        CancellationToken cancellationToken)
    {
        if (requests.Any(item => item.Quantity <= 0 || item.ProductId <= 0))
        {
            return "Each order item requires a product and a positive quantity.";
        }

        if (requests.Select(item => item.ProductId).Distinct().Count() != requests.Count)
        {
            return "A product can only appear once on an order.";
        }

        if (requests.Where(item => item.Id.HasValue).Select(item => item.Id).Distinct().Count()
            != requests.Count(item => item.Id.HasValue))
        {
            return "An order item can only be submitted once.";
        }

        var existingItems = order.Items.ToDictionary(item => item.Id);
        if (isNew && requests.Any(item => item.Id.HasValue))
        {
            return "New orders cannot reference existing order items.";
        }

        if (requests.Any(item => item.Id.HasValue && !existingItems.ContainsKey(item.Id.Value)))
        {
            return "An order item does not belong to this order.";
        }

        var productIds = requests.Select(item => item.ProductId).Distinct().ToArray();
        var products = await context.Products
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        if (products.Count != productIds.Length)
        {
            return "One or more products do not exist.";
        }

        foreach (var itemRequest in requests)
        {
            var product = products[itemRequest.ProductId];
            var existingItem = itemRequest.Id is int itemId
                ? existingItems[itemId]
                : null;

            if (existingItem is null || existingItem.ProductId != product.Id)
            {
                if (!product.IsActive)
                {
                    return $"Product '{product.Sku}' is inactive and cannot be added to an order.";
                }
            }
        }

        var retainedIds = requests
            .Where(item => item.Id.HasValue)
            .Select(item => item.Id!.Value)
            .ToHashSet();

        foreach (var existingItem in order.Items.ToList())
        {
            if (!retainedIds.Contains(existingItem.Id))
            {
                context.OrderItems.Remove(existingItem);
            }
        }

        foreach (var itemRequest in requests)
        {
            var product = products[itemRequest.ProductId];
            if (itemRequest.Id is int itemId)
            {
                var existingItem = existingItems[itemId];
                if (existingItem.ProductId != product.Id)
                {
                    existingItem.ProductId = product.Id;
                    existingItem.Product = product;
                    existingItem.UnitPrice = product.UnitPrice;
                }
                existingItem.Quantity = itemRequest.Quantity;
            }
            else
            {
                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Product = product,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = product.UnitPrice,
                });
            }
        }

        return null;
    }

    private static string OrderNumberTaken() => "OrderNumber already exists.";

    private static void Apply(Order order, OrderRequest request)
    {
        order.OrderNumber = request.OrderNumber.Trim();
        order.OrderDate = request.OrderDate.UtcDateTime;
        order.CustomerId = request.CustomerId;
        order.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        order.Status = request.Status;
    }

    private static OrderResponse ToResponse(Order order)
    {
        var items = order.Items
            .Select(item => new OrderItemResponse(
                item.Id,
                item.ProductId,
                item.Product.Name,
                item.Quantity,
                item.UnitPrice,
                item.LineTotal))
            .ToList();

        return new OrderResponse(
            order.Id,
            order.OrderNumber,
            new DateTimeOffset(DateTime.SpecifyKind(order.OrderDate, DateTimeKind.Utc)),
            order.CustomerId,
            order.Description,
            order.Status,
            items,
            items.Sum(item => item.LineTotal));
    }
}
