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
}