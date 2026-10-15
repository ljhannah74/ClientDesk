using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.Api.Models;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal UnitPrice { get; set; }

    [NotMapped]
    public decimal LineTotal => Quantity * UnitPrice;
}