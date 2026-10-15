namespace MyApp.Api.Models;

/// <summary>Order line data with its snapshot price and calculated total.</summary>
public sealed record OrderItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);