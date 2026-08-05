using Microsoft.EntityFrameworkCore;
using FitnessApi.Models;

namespace FitnessApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WorkoutPlan> WorkoutPlans => Set<WorkoutPlan>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();

    // Seed a single test user so WeightEntry foreign keys resolve
    // before you've built real auth. Replace this once you add auth.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Email = "test@local.dev",
            DisplayName = "Test user",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}