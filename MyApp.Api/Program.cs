using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
var appDataPath =
    builder.Configuration["APP_DATA_PATH"];

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

// Expose the entry point to the integration-test host.
public partial class Program { }
