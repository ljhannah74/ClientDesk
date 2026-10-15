using Microsoft.EntityFrameworkCore;
using MyApp.Api.Models;

namespace MyApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(order =>
        {
            order.Property(x => x.OrderNumber)
                .IsRequired()
                .HasMaxLength(50);

            order.HasIndex(x => x.OrderNumber)
                .IsUnique();

            order.HasOne(x => x.Customer)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Product>(product =>
        {
            product.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            product.Property(x => x.Description)
                .HasMaxLength(1000);

            product.Property(x => x.Sku)
                .IsRequired()
                .HasMaxLength(64);

            product.HasIndex(x => x.Sku)
                .IsUnique();

            product.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);
        });

        modelBuilder.Entity<OrderItem>(item =>
        {
            item.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            item.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_OrderItems_Quantity_Positive",
                    "\"Quantity\" > 0");
                table.HasCheckConstraint(
                    "CK_OrderItems_UnitPrice_NonNegative",
                    "\"UnitPrice\" >= 0");
            });

            item.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            item.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
