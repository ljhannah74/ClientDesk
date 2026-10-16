using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using MyApp.Api.Models;
using Xunit;

namespace MyApp.Api.Tests;

public sealed class BusinessWorkflowTests : IDisposable
{
    private readonly string _directory = Path.Combine(Path.GetTempPath(), "myapp-tests-" + Guid.NewGuid());
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public BusinessWorkflowTests()
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("APP_DATA_PATH", _directory));
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
    }

    [Theory]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData(null, null)]
    [InlineData("Example", "bad")]
    public async Task Invalid_customer_is_rejected_without_saving(string? name, string? email)
    {
        var response = await _client.PostAsJsonAsync("/api/customers", new { name, email });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("errors", await response.Content.ReadAsStringAsync());
        Assert.Empty((await _client.GetFromJsonAsync<Customer[]>("/api/customers"))!);
    }

    [Fact]
    public async Task Customer_limits_are_enforced()
    {
        foreach (var request in new[] {
            new { name = new string('x', 101), email = (string?)null },
            new { name = "Example", email = (string?)(new string('x', 250) + "@example.com") }
        })
            Assert.Equal(HttpStatusCode.BadRequest,
                (await _client.PostAsJsonAsync("/api/customers", request)).StatusCode);
    }

    [Fact]
    public async Task Customer_fields_are_normalized_and_invalid_updates_preserve_data()
    {
        var response = await _client.PostAsJsonAsync("/api/customers", new {
            id = 999, name = "  Alex Example  ", email = "   ",
            orders = new[] { new { orderNumber = "INJECTED" } }
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var customer = (await response.Content.ReadFromJsonAsync<Customer>())!;
        Assert.NotEqual(999, customer.Id);
        Assert.Equal("Alex Example", customer.Name);
        Assert.Null(customer.Email);
        Assert.Empty((await _client.GetFromJsonAsync<Order[]>("/api/orders"))!);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await _client.PutAsJsonAsync($"/api/customers/{customer.Id}", new { name = "", email = "bad" })).StatusCode);
        Assert.Equal("Alex Example",
            (await _client.GetFromJsonAsync<Customer>($"/api/customers/{customer.Id}"))!.Name);
        Assert.Equal(HttpStatusCode.NoContent,
            (await _client.PutAsJsonAsync($"/api/customers/{customer.Id}",
                new { name = "Updated Example", email = "alex@example.com" })).StatusCode);
        var updated = (await _client.GetFromJsonAsync<Customer>($"/api/customers/{customer.Id}"))!;
        Assert.Equal("Updated Example", updated.Name);
        Assert.Equal("alex@example.com", updated.Email);
    }

    [Fact]
    public async Task Orders_enforce_unique_numbers_and_protect_the_customer()
    {
        var customer = await AddCustomer();
        var request = new { orderNumber = "DEMO-001", orderDate = DateTime.UtcNow, customerId = customer.Id, status = "New" };
        var created = await _client.PostAsJsonAsync("/api/orders", request);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var order = (await created.Content.ReadFromJsonAsync<Order>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await _client.PostAsJsonAsync("/api/orders", request)).StatusCode);
        var blocked = await _client.DeleteAsync($"/api/customers/{customer.Id}");
        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
        Assert.Contains("has orders", await blocked.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/orders/{order.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/customers/{customer.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/customers/{customer.Id}")).StatusCode);
    }

    [Fact]
    public async Task Order_requires_an_existing_customer_and_supported_status()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/orders",
            new { orderNumber = "DEMO-002", orderDate = DateTime.UtcNow, customerId = 999, status = "New" })).StatusCode);
        var customer = await AddCustomer();
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/orders",
            new { orderNumber = "DEMO-002", orderDate = DateTime.UtcNow, customerId = customer.Id, status = "Invalid" })).StatusCode);
    }

    private async Task<Customer> AddCustomer()
    {
        var response = await _client.PostAsJsonAsync("/api/customers", new { name = "Alex Example" });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<Customer>())!;
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        if (Directory.Exists(_directory)) Directory.Delete(_directory, recursive: true);
    }
}
