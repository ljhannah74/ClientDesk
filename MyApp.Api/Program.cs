using Microsoft.EntityFrameworkCore;
using MyApp.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
var databaseProvider =
    builder.Configuration["DatabaseProvider"] ?? "Sqlite";

if (databaseProvider.Equals(
        "SqlServer",
        StringComparison.OrdinalIgnoreCase))
{
    var connectionString =
        builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "The SQL Server connection string is missing.");
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseAzureSql(connectionString));
}
else if (databaseProvider.Equals(
             "Sqlite",
             StringComparison.OrdinalIgnoreCase))
{
    var appDataPath = builder.Configuration["APP_DATA_PATH"];

    if (string.IsNullOrWhiteSpace(appDataPath))
    {
        appDataPath = AppContext.BaseDirectory;
    }

    Directory.CreateDirectory(appDataPath);

    var databasePath = Path.Combine(appDataPath, "myapp.db");

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite($"Data Source={databasePath}"));
}
else
{
    throw new InvalidOperationException(
        $"Unsupported database provider: {databaseProvider}");
}

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

if (app.Configuration.GetValue<bool>("Demo:ReadOnly"))
{
    app.Use(async (context, next) =>
    {
        var isReadRequest =
            HttpMethods.IsGet(context.Request.Method) ||
            HttpMethods.IsHead(context.Request.Method) ||
            HttpMethods.IsOptions(context.Request.Method);

        if (context.Request.Path.StartsWithSegments("/api") &&
            !isReadRequest)
        {
            context.Response.StatusCode =
                StatusCodes.Status403Forbidden;

            await context.Response.WriteAsJsonAsync(new
            {
                message = "This public demo is read-only."
            });

            return;
        }

        await next(context);
    });
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    // Existing migrations were generated for SQLite.
    // Azure SQL schema changes will be applied separately.
    if (db.Database.IsSqlite())
    {
        db.Database.Migrate();
    }
}

app.UseHttpsRedirection();

app.UseCors("ReactApp");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();

// Expose the entry point to the integration-test host.
public partial class Program { }
