namespace MyApp.Api.Models;

/// <summary>Order data and its lines with a calculated total.</summary>
public sealed record OrderResponse(
    int Id,
    string OrderNumber,
    DateTimeOffset OrderDate,
    int CustomerId,
    string? Description,
    string Status,
    IReadOnlyList<OrderItemResponse> Items,
    decimal Total);