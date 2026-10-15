using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

public sealed record OrderRequest
{
    [Required]
    [StringLength(50)]
    public required string OrderNumber { get; init; }

    public DateTimeOffset OrderDate { get; init; }

    public int CustomerId { get; init; }

    [StringLength(500)]
    public string? Description { get; init; }

    [AllowedValues("New", "Processing", "Completed", "Cancelled")]
    public string Status { get; init; } = "New";

    public IReadOnlyList<OrderItemRequest>? Items { get; init; }
}
