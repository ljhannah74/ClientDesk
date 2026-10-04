using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

public class OrderRequest
{
    [Required]
    [StringLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    public DateTime OrderDate { get; set; }

    public int CustomerId { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [AllowedValues("New", "Processing", "Completed", "Cancelled")]
    public string Status { get; set; } = "New";
}
