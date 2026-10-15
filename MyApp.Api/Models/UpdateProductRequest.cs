using System.ComponentModel.DataAnnotations;

namespace MyApp.Api.Models;

/// <summary>Request payload for updating a product.</summary>
public sealed record UpdateProductRequest : IValidatableObject
{
    [Required, StringLength(200)]
    public required string Name { get; init; }

    [StringLength(1000)]
    public string? Description { get; init; }

    [Required, StringLength(64)]
    public required string Sku { get; init; }

    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public required decimal UnitPrice { get; init; }

    public required bool IsActive { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UnitPrice != decimal.Round(UnitPrice, 2))
        {
            yield return new ValidationResult(
                "UnitPrice cannot have more than two decimal places.",
                [nameof(UnitPrice)]);
        }
    }
}