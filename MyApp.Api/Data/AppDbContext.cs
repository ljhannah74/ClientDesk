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

        modelBuilder.Entity<Product>(entity =>
        {
        entity.HasKey(p => p.Id);

        entity.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(50);

        entity.HasIndex(p => p.Sku)
            .IsUnique();

        entity.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        entity.Property(p => p.Description)
            .HasMaxLength(1000);

        entity.Property(p => p.UnitPrice)
            .HasPrecision(18, 2);

        entity.Property(p => p.IsActive)
            .HasDefaultValue(true);
    });
    }
}
