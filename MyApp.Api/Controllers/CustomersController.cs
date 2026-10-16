using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Models;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> Get()
    {
        return await _context.Customers
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Customer>> Get(int id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
            return NotFound();

        return customer;
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> Create(CustomerRequest request)
    {
        var customer = new Customer
        {
            Name = request.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim()
        };
        _context.Customers.Add(customer);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(Get),
            new { id = customer.Id },
            customer);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
    int id,
    CustomerRequest request)
    {
        var existingCustomer =
            await _context.Customers.FindAsync(id);

        if (existingCustomer == null)
        {
            return NotFound();
        }

        existingCustomer.Name = request.Name.Trim();
        existingCustomer.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound();
        }

        if (await _context.Orders.AnyAsync(x => x.CustomerId == id))
        {
            return Conflict("Customer has orders and cannot be deleted.");
        }

        _context.Customers.Remove(customer);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
