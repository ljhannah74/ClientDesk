namespace MyApp.Api.Models;

/// <summary>Product data returned by the API.</summary>
public sealed record ProductResponse(
    int Id,
    string Name,
    string? Description,
    string Sku,
    decimal UnitPrice,
    bool IsActive);