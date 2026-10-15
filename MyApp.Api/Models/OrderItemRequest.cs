using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

/// <summary>Order line input; its unit price is assigned from the product.</summary>
public sealed record OrderItemRequest
{
    public int? Id { get; init; }

    [Range(1, int.MaxValue)]
    public int ProductId { get; init; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; init; }
}