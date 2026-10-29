using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Models;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        return await _context.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound();
        }

        return product;
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Create(Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Sku))
            return BadRequest("SKU is required.");

        if (string.IsNullOrWhiteSpace(product.Name))
            return BadRequest("Product name is required.");

        if (product.UnitPrice < 0)
            return BadRequest("Unit price cannot be negative.");

        if (decimal.Round(product.UnitPrice, 2) != product.UnitPrice)
            return BadRequest("Unit price cannot exceed two decimal places.");

        product.Id = 0;
        product.Sku = product.Sku.Trim();
        product.Name = product.Name.Trim();

        if (await _context.Products.AnyAsync(p => p.Sku == product.Sku))
            return Conflict("A product with this SKU already exists.");

        _context.Products.Add(product);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict("Unable to create product. The SKU may already exist.");
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = product.Id },
            product
        );
    }
}