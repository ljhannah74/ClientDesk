using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Models;
using MyApp.Api.Services;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService products) : ControllerBase
{
    [HttpGet]
    [Microsoft.AspNetCore.Http.EndpointSummary("List products")]
    [Microsoft.AspNetCore.Http.EndpointDescription("Returns all products, including inactive products.")]
    [ProducesResponseType(typeof(IReadOnlyList<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> Get(
        CancellationToken cancellationToken)
    {
        return Ok(await products.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:int}")]
    [Microsoft.AspNetCore.Http.EndpointSummary("Get a product")]
    [Microsoft.AspNetCore.Http.EndpointDescription("Returns a product by its ID.")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> Get(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        return product is null
            ? Problem(title: "Product not found.", statusCode: StatusCodes.Status404NotFound)
            : Ok(product);
    }

    [HttpPost]
    [Microsoft.AspNetCore.Http.EndpointSummary("Create a product")]
    [Microsoft.AspNetCore.Http.EndpointDescription("Creates a product with a unique SKU and a non-negative unit price.")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var product = await products.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
        }
        catch (ProductConflictException exception)
        {
            return Problem(
                title: "Product conflict.",
                detail: exception.Message,
                statusCode: StatusCodes.Status409Conflict);
        }
    }

    [HttpPut("{id:int}")]
    [Microsoft.AspNetCore.Http.EndpointSummary("Update a product")]
    [Microsoft.AspNetCore.Http.EndpointDescription("Updates a product's details, price, SKU, and active state.")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Update(
        int id,
        UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var product = await products.UpdateAsync(id, request, cancellationToken);
            return product is null
                ? Problem(title: "Product not found.", statusCode: StatusCodes.Status404NotFound)
                : Ok(product);
        }
        catch (ProductConflictException exception)
        {
            return Problem(
                title: "Product conflict.",
                detail: exception.Message,
                statusCode: StatusCodes.Status409Conflict);
        }
    }

    [HttpDelete("{id:int}")]
    [Microsoft.AspNetCore.Http.EndpointSummary("Delete a product")]
    [Microsoft.AspNetCore.Http.EndpointDescription("Deletes an unused product; products referenced by order items must be deactivated instead.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await products.DeleteAsync(id, cancellationToken);
            return deleted
                ? NoContent()
                : Problem(title: "Product not found.", statusCode: StatusCodes.Status404NotFound);
        }
        catch (ProductConflictException exception)
        {
            return Problem(
                title: "Product conflict.",
                detail: exception.Message,
                statusCode: StatusCodes.Status409Conflict);
        }
    }
}