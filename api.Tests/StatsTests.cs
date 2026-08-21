using Microsoft.AspNetCore.Mvc;
using FitnessApi.Controllers;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Tests;

[Collection(nameof(DatabaseCollection))]
public class StatsTests
{
    private readonly DatabaseFixture _fixture;

    public StatsTests(DatabaseFixture fixture) => _fixture = fixture;

    private static DateTime MondayOfThisWeek()
    {
        var today = DateTime.UtcNow.Date;
        return today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
    }

    /// Exercises owned by the test's own user rather than seeded ones looked up
    /// by name: the seeded catalog is shared across tests, so depending on its
    /// contents couples otherwise-independent tests together.
    private static async Task<Exercise> AddExerciseAsync(
        AppDbContext db, string userId, ExerciseMode mode, ExerciseWeightType? weightType)
    {
        var exercise = new Exercise
        {
            Name = $"Test exercise {Guid.NewGuid():N}",
            Mode = mode,
            WeightType = weightType,
            TargetMuscle = "Test",
            CreatedByUserId = userId,
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();
        return exercise;
    }

    /// A session with one log against the given exercise, dated as supplied.
    private static async Task<Guid> AddSessionAsync(
        AppDbContext db, string userId, Guid exerciseId,
        DateTime startedAt, DateTime? completedAt = null,
        bool withLog = true, decimal? weight = null, int? reps = null, int? seconds = null)
    {
        var session = new WorkoutSession
        {
            UserId = userId,
            RoutineName = "Test day",
            StartedAt = startedAt,
            CompletedAt = completedAt,
        };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();

        if (withLog)
        {
            db.WorkoutLogs.Add(new WorkoutLog
            {
                UserId = userId,
                ExerciseId = exerciseId,
                SessionId = session.Id,
                CompletedAt = startedAt,
                ActualSets = 3,
                ActualReps = reps,
                ActualTimeSeconds = seconds,
                WeightUsedKg = weight,
            });
            await db.SaveChangesAsync();
        }

        return session.Id;
    }

    private async Task<ConsistencyStats> GetConsistencyAsync(AppDbContext db, string userId)
    {
        var controller = new StatsController(db);
        TestContext.Authenticate(controller, userId);
        var result = await controller.GetConsistency();
        return Assert.IsType<ConsistencyStats>(
            Assert.IsType<OkObjectResult>(result.Result).Value);
    }

    [Fact]
    public async Task SessionWithNoLogs_DoesNotCount()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);

        await AddSessionAsync(db, userId, exercise.Id, MondayOfThisWeek().AddHours(9));
        // Started and abandoned - shouldn't inflate the total.
        await AddSessionAsync(db, userId, exercise.Id, MondayOfThisWeek().AddHours(12),
            withLog: false);

        var stats = await GetConsistencyAsync(db, userId);

        Assert.Equal(1, stats.TotalWorkouts);
    }

    [Fact]
    public async Task WeekStreak_CountsConsecutiveWeeks()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);
        var monday = MondayOfThisWeek();

        await AddSessionAsync(db, userId, exercise.Id, monday.AddHours(9));
        await AddSessionAsync(db, userId, exercise.Id, monday.AddDays(-7).AddHours(9));
        await AddSessionAsync(db, userId, exercise.Id, monday.AddDays(-14).AddHours(9));

        var stats = await GetConsistencyAsync(db, userId);

        Assert.Equal(3, stats.WeekStreak);
    }

    [Fact]
    public async Task WeekStreak_BreaksOnAGap()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);
        var monday = MondayOfThisWeek();

        await AddSessionAsync(db, userId, exercise.Id, monday.AddHours(9));
        // Nothing last week; the streak must stop at the current week.
        await AddSessionAsync(db, userId, exercise.Id, monday.AddDays(-14).AddHours(9));

        var stats = await GetConsistencyAsync(db, userId);

        Assert.Equal(1, stats.WeekStreak);
        Assert.Equal(2, stats.TotalWorkouts);
    }

    [Fact]
    public async Task WeeklyCounts_BucketByMondayStartedWeek()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);
        var monday = MondayOfThisWeek();

        // Monday and the following Sunday belong to the same week.
        await AddSessionAsync(db, userId, exercise.Id, monday.AddHours(9));
        await AddSessionAsync(db, userId, exercise.Id, monday.AddDays(6).AddHours(9));

        var stats = await GetConsistencyAsync(db, userId);

        Assert.Equal(2, stats.WorkoutsThisWeek);
        Assert.Equal(2, stats.WeeklyCounts.Last().Count);
    }

    [Fact]
    public async Task AverageDuration_UsesOnlyCompletedSessions()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);
        var start = MondayOfThisWeek().AddHours(9);

        await AddSessionAsync(db, userId, exercise.Id, start, start.AddMinutes(30));
        await AddSessionAsync(db, userId, exercise.Id, start.AddHours(3),
            start.AddHours(3).AddMinutes(50));
        // Still running - no end time, so it can't contribute a duration.
        await AddSessionAsync(db, userId, exercise.Id, start.AddHours(6));

        var stats = await GetConsistencyAsync(db, userId);

        Assert.Equal(40, stats.AverageDurationMinutes);
    }

    private async Task<List<ExerciseProgress>> GetProgressAsync(
        AppDbContext db, string userId)
    {
        var controller = new StatsController(db);
        TestContext.Authenticate(controller, userId);
        var result = await controller.GetExerciseProgress();
        return Assert.IsType<List<ExerciseProgress>>(
            Assert.IsType<OkObjectResult>(result.Result).Value);
    }

    [Fact]
    public async Task Progression_TracksWeight_ForExternallyLoadedExercise()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var benchPress = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.External);
        var start = MondayOfThisWeek().AddHours(9);

        await AddSessionAsync(db, userId, benchPress.Id, start, weight: 60m, reps: 8);
        await AddSessionAsync(db, userId, benchPress.Id, start.AddDays(2),
            weight: 70m, reps: 8);

        var progress = Assert.Single(await GetProgressAsync(db, userId));

        Assert.Equal("Weight", progress.Metric);
        Assert.Equal("kg", progress.Unit);
        Assert.Equal(60m, progress.First);
        Assert.Equal(70m, progress.Latest);
        Assert.Equal(10m, progress.Delta);
    }

    [Fact]
    public async Task Progression_TracksReps_ForBodyweightExercise()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var pushUp = await AddExerciseAsync(
            db, userId, ExerciseMode.Reps, ExerciseWeightType.Bodyweight);
        var start = MondayOfThisWeek().AddHours(9);

        await AddSessionAsync(db, userId, pushUp.Id, start, reps: 10);
        await AddSessionAsync(db, userId, pushUp.Id, start.AddDays(2), reps: 15);

        var progress = Assert.Single(await GetProgressAsync(db, userId));

        // Weight is meaningless here, so progression is measured in reps.
        Assert.Equal("Reps", progress.Metric);
        Assert.Equal(15m, progress.Latest);
        Assert.Equal(5m, progress.Delta);
    }

    [Fact]
    public async Task Progression_TracksSeconds_ForTimedExercise()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var plank = await AddExerciseAsync(
            db, userId, ExerciseMode.Time, null);
        var start = MondayOfThisWeek().AddHours(9);

        await AddSessionAsync(db, userId, plank.Id, start, seconds: 30);
        await AddSessionAsync(db, userId, plank.Id, start.AddDays(2), seconds: 45);

        var progress = Assert.Single(await GetProgressAsync(db, userId));

        Assert.Equal("Time", progress.Metric);
        Assert.Equal("s", progress.Unit);
        Assert.Equal(15m, progress.Delta);
    }
}
