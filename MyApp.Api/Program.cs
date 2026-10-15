using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;
using MyApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<IProductService, ProductService>();
var appDataPath =
    Environment.GetEnvironmentVariable("APP_DATA_PATH");

if (string.IsNullOrWhiteSpace(appDataPath))
{
    appDataPath = AppContext.BaseDirectory;
}

Directory.CreateDirectory(appDataPath);

var databasePath =
    Path.Combine(appDataPath, "myapp.db");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(
        $"Data Source={databasePath}");
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var db =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    db.Database.Migrate();
}

app.UseHttpsRedirection();

app.UseCors("ReactApp");

app.MapControllers();

app.Run();