using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Models;

namespace MyApp.Api.Services;

public sealed class ProductService(AppDbContext context) : IProductService
{
    public async Task<IReadOnlyList<ProductResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await context.Products
            .AsNoTracking()
            .OrderBy(product => product.Name)
            .Select(product => ToResponse(product))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

        return product is null ? null : ToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(
        CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var sku = request.Sku.Trim();
        await EnsureSkuAvailableAsync(sku, null, cancellationToken);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = NormalizeDescription(request.Description),
            Sku = sku,
            UnitPrice = request.UnitPrice,
            IsActive = request.IsActive,
        };

        context.Products.Add(product);
        await SaveChangesAsync(cancellationToken);
        return ToResponse(product);
    }

    public async Task<ProductResponse?> UpdateAsync(
        int id,
        UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        var product = await context.Products
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

        if (product is null)
        {
            return null;
        }

        var sku = request.Sku.Trim();
        await EnsureSkuAvailableAsync(sku, id, cancellationToken);

        product.Name = request.Name.Trim();
        product.Description = NormalizeDescription(request.Description);
        product.Sku = sku;
        product.UnitPrice = request.UnitPrice;
        product.IsActive = request.IsActive;

        await SaveChangesAsync(cancellationToken);
        return ToResponse(product);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var product = await context.Products
            .FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

        if (product is null)
        {
            return false;
        }

        if (await context.OrderItems.AnyAsync(
            item => item.ProductId == id,
            cancellationToken))
        {
            throw new ProductConflictException(
                "A product used by an order cannot be deleted. Deactivate it instead.");
        }

        context.Products.Remove(product);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureSkuAvailableAsync(
        string sku,
        int? excludedId,
        CancellationToken cancellationToken)
    {
        var isTaken = await context.Products.AnyAsync(product =>
            product.Sku == sku && product.Id != excludedId,
            cancellationToken);

        if (isTaken)
        {
            throw new ProductConflictException("SKU already exists.");
        }
    }

    private async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            throw new ProductConflictException("A product constraint was violated.");
        }
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    private static ProductResponse ToResponse(Product product) => new(
        product.Id,
        product.Name,
        product.Description,
        product.Sku,
        product.UnitPrice,
        product.IsActive);
}

public sealed class ProductConflictException(string message) : Exception(message);