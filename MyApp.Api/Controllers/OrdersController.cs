using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Models;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> Get(
        [FromQuery] int? customerId)
    {
        var query = _context.Orders.AsNoTracking();

        if (customerId.HasValue)
        {
            query = query.Where(x => x.CustomerId == customerId.Value);
        }

        return await query
            .OrderByDescending(x => x.OrderDate)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Order>> Get(int id)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null)
            return NotFound();

        return order;
    }

    [HttpPost]
    public async Task<ActionResult<Order>> Create(OrderRequest request)
    {
        var error = await ValidateAsync(request, null);

        if (error != null)
            return error;

        var order = new Order();
        Apply(order, request);

        _context.Orders.Add(order);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(OrderNumberTaken());
        }

        return CreatedAtAction(
            nameof(Get),
            new { id = order.Id },
            order);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, OrderRequest request)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
            return NotFound();

        var error = await ValidateAsync(request, id);

        if (error != null)
            return error;

        Apply(order, request);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(OrderNumberTaken());
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
            return NotFound();

        _context.Orders.Remove(order);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidateAsync(
        OrderRequest request,
        int? existingId)
    {
        if (request.OrderDate == default)
            return BadRequest("OrderDate is required.");

        if (!await _context.Customers.AnyAsync(x => x.Id == request.CustomerId))
            return BadRequest("CustomerId does not exist.");

        var taken = await _context.Orders.AnyAsync(x =>
            x.OrderNumber == request.OrderNumber && x.Id != existingId);

        if (taken)
            return Conflict(OrderNumberTaken());

        return null;
    }

    private static string OrderNumberTaken() =>
        "OrderNumber already exists.";

    private static void Apply(Order order, OrderRequest request)
    {
        order.OrderNumber = request.OrderNumber;
        order.OrderDate = request.OrderDate.ToUniversalTime();
        order.CustomerId = request.CustomerId;
        order.Description = request.Description;
        order.Status = request.Status;
    }
}
