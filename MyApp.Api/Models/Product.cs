using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

public class Product
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(64)]
    public string Sku { get; set; } = string.Empty;

    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal UnitPrice { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}