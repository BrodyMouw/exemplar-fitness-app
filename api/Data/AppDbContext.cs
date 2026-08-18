using Microsoft.EntityFrameworkCore;
using FitnessApi.Models;

namespace FitnessApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WorkoutPlan> WorkoutPlans => Set<WorkoutPlan>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<RoutineExercise> RoutineExercises => Set<RoutineExercise>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ArchivedExercise> ArchivedExercises => Set<ArchivedExercise>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // RoutineExercise -> Exercise points at shared/global catalog data.
        // The default cascade-delete behavior would mean deleting one master
        // exercise wipes every user's routines that reference it - restrict instead.
        modelBuilder.Entity<RoutineExercise>()
            .HasOne(re => re.Exercise)
            .WithMany()
            .HasForeignKey(re => re.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        // Logged history is permanent: it records its catalog exercise directly,
        // so deleting the plan that prescribed it only clears the back-link.
        modelBuilder.Entity<WorkoutLog>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutLog>()
            .HasOne(l => l.Exercise)
            .WithMany()
            .HasForeignKey(l => l.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkoutLog>()
            .HasOne(l => l.RoutineExercise)
            .WithMany()
            .HasForeignKey(l => l.RoutineExerciseId)
            .OnDelete(DeleteBehavior.SetNull);

        // Custom exercises belong to their creator; seeded ones have no owner.
        modelBuilder.Entity<Exercise>()
            .HasOne(e => e.CreatedByUser)
            .WithMany()
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Disposable per-user metadata, so cascading from either side is fine.
        modelBuilder.Entity<ArchivedExercise>().HasKey(a => new { a.UserId, a.ExerciseId });

        modelBuilder.Entity<ArchivedExercise>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ArchivedExercise>()
            .HasOne(a => a.Exercise)
            .WithMany()
            .HasForeignKey(a => a.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Exercise>().HasData(
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "Bench Press", Description = "Barbell press lying on a flat bench.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Chest" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Squat", Description = "Barbell back squat.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Legs" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Deadlift", Description = "Barbell deadlift from the floor.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Back" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Name = "Overhead Press", Description = "Standing barbell press overhead.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Shoulders" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Name = "Barbell Row", Description = "Bent-over barbell row.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Back" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000006"), Name = "Bicep Curl", Description = "Dumbbell or barbell curl.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Arms" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000007"), Name = "Tricep Extension", Description = "Overhead or cable tricep extension.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Arms" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000008"), Name = "Leg Press", Description = "Machine leg press.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Legs" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000009"), Name = "Lat Pulldown", Description = "Cable lat pulldown.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Back" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000010"), Name = "Dumbbell Lunge", Description = "Walking or stationary dumbbell lunge.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.External, TargetMuscle = "Legs" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000011"), Name = "Push-Up", Description = "Standard bodyweight push-up.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.Bodyweight, TargetMuscle = "Chest" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000012"), Name = "Pull-Up", Description = "Bodyweight pull-up.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.Bodyweight, TargetMuscle = "Back" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000013"), Name = "Bodyweight Squat", Description = "Air squat, no added weight.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.Bodyweight, TargetMuscle = "Legs" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000014"), Name = "Dip", Description = "Parallel bar dip.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.Bodyweight, TargetMuscle = "Arms" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000015"), Name = "Sit-Up", Description = "Standard bodyweight sit-up.", Mode = ExerciseMode.Reps, WeightType = ExerciseWeightType.Bodyweight, TargetMuscle = "Core" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000016"), Name = "Plank", Description = "Timed front plank hold.", Mode = ExerciseMode.Time, WeightType = null, TargetMuscle = "Core" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000017"), Name = "Wall Sit", Description = "Timed wall sit hold.", Mode = ExerciseMode.Time, WeightType = null, TargetMuscle = "Legs" },
            new Exercise { Id = Guid.Parse("00000000-0000-0000-0000-000000000018"), Name = "Jump Rope", Description = "Timed jump rope interval.", Mode = ExerciseMode.Time, WeightType = null, TargetMuscle = "Cardio" }
        );
    }
}
