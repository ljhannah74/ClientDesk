using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

public class Order
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    // Stored as UTC.
    public DateTime OrderDate { get; set; }

    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public string Status { get; set; } = "New";
}
