using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Tests;

/// The project's central data guarantee: a training log outlives the plan that
/// produced it. This is enforced entirely by foreign-key delete behaviour, so
/// these assertions only mean anything against a real database.
[Collection(nameof(DatabaseCollection))]
public class DurableHistoryTests
{
    private readonly DatabaseFixture _fixture;

    public DurableHistoryTests(DatabaseFixture fixture) => _fixture = fixture;

    private async Task<(string UserId, Guid PlanId, Guid LogId, Guid ExerciseId)>
        SeedLoggedWorkoutAsync()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = db.Exercises.First(e => e.CreatedByUserId == null);

        var plan = new WorkoutPlan { UserId = userId, Name = "Doomed plan" };
        var routine = new Routine { Name = "Day 1", Order = 0 };
        var routineExercise = new RoutineExercise
        {
            ExerciseId = exercise.Id,
            Sets = 3,
            RepsPerSet = 5,
            WeightKg = 100m,
        };

        routine.RoutineExercises.Add(routineExercise);
        plan.Routines.Add(routine);
        db.WorkoutPlans.Add(plan);
        await db.SaveChangesAsync();

        var log = new WorkoutLog
        {
            UserId = userId,
            ExerciseId = exercise.Id,
            RoutineExerciseId = routineExercise.Id,
            ActualSets = 3,
            ActualReps = 5,
            WeightUsedKg = 100m,
        };
        db.WorkoutLogs.Add(log);
        await db.SaveChangesAsync();

        return (userId, plan.Id, log.Id, exercise.Id);
    }

    [Fact]
    public async Task DeletingPlan_KeepsLog_AndClearsOnlyThePrescriptionLink()
    {
        var seed = await SeedLoggedWorkoutAsync();

        await using (var db = _fixture.CreateContext())
        {
            db.WorkoutPlans.Remove(
                await db.WorkoutPlans.FirstAsync(p => p.Id == seed.PlanId));
            await db.SaveChangesAsync();
        }

        await using var verify = _fixture.CreateContext();
        var log = await verify.WorkoutLogs.FirstOrDefaultAsync(l => l.Id == seed.LogId);

        Assert.NotNull(log);
        // The link to the deleted prescription is severed...
        Assert.Null(log!.RoutineExerciseId);
        // ...but what was actually performed is still known, which is what
        // keeps the exercise's history visible on the progress screen.
        Assert.Equal(seed.ExerciseId, log.ExerciseId);
        Assert.Equal(100m, log.WeightUsedKg);
        Assert.Equal(3, log.ActualSets);
    }

    [Fact]
    public async Task DeletingPlan_CascadesToRoutinesAndPrescriptions()
    {
        var seed = await SeedLoggedWorkoutAsync();

        await using (var db = _fixture.CreateContext())
        {
            db.WorkoutPlans.Remove(
                await db.WorkoutPlans.FirstAsync(p => p.Id == seed.PlanId));
            await db.SaveChangesAsync();
        }

        await using var verify = _fixture.CreateContext();
        Assert.False(await verify.Routines.AnyAsync(r => r.WorkoutPlanId == seed.PlanId));
    }

    [Fact]
    public async Task CatalogExercise_CannotBeDeleted_WhileHistoryReferencesIt()
    {
        var seed = await SeedLoggedWorkoutAsync();

        await using var db = _fixture.CreateContext();
        db.Exercises.Remove(await db.Exercises.FirstAsync(e => e.Id == seed.ExerciseId));

        // RESTRICT, not cascade: removing a catalog entry must never take
        // logged history with it. Archiving exists precisely because of this.
        await Assert.ThrowsAnyAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task ProgressStats_StillReportHistory_AfterItsPlanIsDeleted()
    {
        var seed = await SeedLoggedWorkoutAsync();

        await using (var db = _fixture.CreateContext())
        {
            db.WorkoutPlans.Remove(
                await db.WorkoutPlans.FirstAsync(p => p.Id == seed.PlanId));
            await db.SaveChangesAsync();
        }

        await using var db2 = _fixture.CreateContext();
        var controller = new Controllers.StatsController(db2);
        TestContext.Authenticate(controller, seed.UserId);

        var result = await controller.GetExerciseProgress();
        var progress = Assert.IsType<List<Controllers.ExerciseProgress>>(
            Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result.Result).Value);

        // Regression guard: stats used to reach the catalog by joining through
        // the prescription, so an orphaned log silently vanished from here.
        Assert.Single(progress);
        Assert.Equal(seed.ExerciseId, progress[0].ExerciseId);
    }
}
