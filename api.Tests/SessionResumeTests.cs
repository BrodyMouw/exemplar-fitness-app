using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Controllers;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Tests;

/// Starting a workout is idempotent. Without that, re-entering a routine you're
/// midway through forks a second session - which would double the workout count
/// and halve both durations.
[Collection(nameof(DatabaseCollection))]
public class SessionResumeTests
{
    private readonly DatabaseFixture _fixture;

    public SessionResumeTests(DatabaseFixture fixture) => _fixture = fixture;

    private static async Task<(string UserId, Guid RoutineId, Guid RoutineExerciseId)>
        SeedRoutineAsync(AppDbContext db)
    {
        var userId = await TestContext.CreateUserAsync(db);
        var exercise = db.Exercises.First(e => e.CreatedByUserId == null);

        var plan = new WorkoutPlan { UserId = userId, Name = "Plan" };
        var routine = new Routine { Name = "Day 1", Order = 0 };
        var routineExercise = new RoutineExercise
        {
            ExerciseId = exercise.Id,
            Sets = 3,
            RepsPerSet = 10,
        };
        routine.RoutineExercises.Add(routineExercise);
        plan.Routines.Add(routine);
        db.WorkoutPlans.Add(plan);
        await db.SaveChangesAsync();

        return (userId, routine.Id, routineExercise.Id);
    }

    private static async Task<SessionWithLogs> StartAsync(
        AppDbContext db, string userId, Guid routineId)
    {
        var controller = new WorkoutSessionsController(db);
        TestContext.Authenticate(controller, userId);
        var result = await controller.StartOrResume(routineId);
        return Assert.IsType<SessionWithLogs>(
            Assert.IsType<OkObjectResult>(result.Result).Value);
    }

    [Fact]
    public async Task StartingTwiceSameDay_ResumesTheSameSession()
    {
        await using var db = _fixture.CreateContext();
        var seed = await SeedRoutineAsync(db);

        var first = await StartAsync(db, seed.UserId, seed.RoutineId);
        var second = await StartAsync(db, seed.UserId, seed.RoutineId);

        Assert.Equal(first.Session.Id, second.Session.Id);

        await using var verify = _fixture.CreateContext();
        var count = await verify.WorkoutSessions
            .CountAsync(s => s.RoutineId == seed.RoutineId);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task ResumedSession_ReturnsWhatWasAlreadyLogged()
    {
        await using var db = _fixture.CreateContext();
        var seed = await SeedRoutineAsync(db);

        var started = await StartAsync(db, seed.UserId, seed.RoutineId);

        var logController = new WorkoutLogsController(db);
        TestContext.Authenticate(logController, seed.UserId);
        await logController.Create(
            seed.RoutineExerciseId,
            new WorkoutLogRequest(3, 10, null, 80m, started.Session.Id));

        var resumed = await StartAsync(db, seed.UserId, seed.RoutineId);

        // This payload is what lets the runner restore its checkmarks and
        // entered values instead of logging the same exercise twice.
        var log = Assert.Single(resumed.Logs);
        Assert.Equal(seed.RoutineExerciseId, log.RoutineExerciseId);
        Assert.Equal(80m, log.WeightUsedKg);
    }

    [Fact]
    public async Task StaleSessionFromPreviousDay_IsClosedAndANewOneStarts()
    {
        await using var db = _fixture.CreateContext();
        var seed = await SeedRoutineAsync(db);

        var stale = new WorkoutSession
        {
            UserId = seed.UserId,
            RoutineId = seed.RoutineId,
            RoutineName = "Day 1",
            StartedAt = DateTime.UtcNow.AddDays(-2),
        };
        db.WorkoutSessions.Add(stale);
        await db.SaveChangesAsync();

        var started = await StartAsync(db, seed.UserId, seed.RoutineId);

        Assert.NotEqual(stale.Id, started.Session.Id);

        await using var verify = _fixture.CreateContext();
        var closed = await verify.WorkoutSessions.FirstAsync(s => s.Id == stale.Id);
        Assert.NotNull(closed.CompletedAt);
    }

    [Fact]
    public async Task CompletedSession_IsNotResumed()
    {
        await using var db = _fixture.CreateContext();
        var seed = await SeedRoutineAsync(db);

        var first = await StartAsync(db, seed.UserId, seed.RoutineId);

        var controller = new WorkoutSessionsController(db);
        TestContext.Authenticate(controller, seed.UserId);
        await controller.Complete(first.Session.Id);

        var second = await StartAsync(db, seed.UserId, seed.RoutineId);

        // Finishing and going again is a genuinely separate workout.
        Assert.NotEqual(first.Session.Id, second.Session.Id);
    }

    [Fact]
    public async Task StartingAnotherUsersRoutine_ReturnsNotFound()
    {
        await using var db = _fixture.CreateContext();
        var seed = await SeedRoutineAsync(db);
        var intruder = await TestContext.CreateUserAsync(db);

        var controller = new WorkoutSessionsController(db);
        TestContext.Authenticate(controller, intruder);

        var result = await controller.StartOrResume(seed.RoutineId);

        Assert.IsType<NotFoundResult>(result.Result);
    }
}
