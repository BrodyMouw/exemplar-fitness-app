using FitnessApi.Data;
using FitnessApi.Models;
using FitnessApi.Services;

namespace FitnessApi.Tests;

/// The estimate itself needs no database, so the interesting decisions - which
/// source wins, and what the prescription is worth - are tested directly.
public class RoutineEstimatorTests
{
    private static Routine RoutineWith(params RoutineExercise[] items)
    {
        var routine = new Routine { Name = "Test day" };
        routine.RoutineExercises.AddRange(items);
        return routine;
    }

    private static RoutineExercise Reps(int sets, int reps, ExerciseWeightType weightType) =>
        new()
        {
            Sets = sets,
            RepsPerSet = reps,
            Exercise = new Exercise { Mode = ExerciseMode.Reps, WeightType = weightType },
        };

    private static RoutineExercise Timed(int sets, int seconds) =>
        new()
        {
            Sets = sets,
            TimePerSetSeconds = seconds,
            Exercise = new Exercise { Mode = ExerciseMode.Time },
        };

    /// The case that drove the design. A routine trained nine times at ~65
    /// minutes also carries a 1-minute run-through - real, recorded, and a
    /// terrible predictor. The mean of that set rounds to 60; the median is 65.
    [Fact]
    public void UsesTheMedianSoOneOddSessionCannotSkewTheEstimate()
    {
        var durations = new List<double> { 1 };
        durations.AddRange(Enumerable.Repeat(65.0, 9));

        var estimate = RoutineEstimator.For(
            RoutineWith(Reps(3, 10, ExerciseWeightType.External)), durations);

        Assert.NotNull(estimate);
        Assert.Equal(RoutineEstimateSource.History, estimate.Source);
        Assert.Equal(65, estimate.Minutes);
        Assert.Equal(10, estimate.SessionCount);
    }

    /// Three is the threshold on purpose: it is the smallest sample in which a
    /// single outlier cannot be the middle value.
    [Fact]
    public void ThreeSessionsIsEnoughToShrugOffOneOutlier()
    {
        var estimate = RoutineEstimator.For(
            RoutineWith(Reps(3, 10, ExerciseWeightType.External)),
            new List<double> { 1, 65, 65 });

        Assert.Equal(RoutineEstimateSource.History, estimate!.Source);
        Assert.Equal(65, estimate.Minutes);
    }

    /// With two, that same outlier would drag the midpoint halfway to nonsense,
    /// so the prescription is the safer answer until there is a third.
    [Fact]
    public void FallsBackToThePrescriptionBelowThreeSessions()
    {
        var estimate = RoutineEstimator.For(
            RoutineWith(Reps(3, 10, ExerciseWeightType.External)),
            new List<double> { 1, 65 });

        Assert.Equal(RoutineEstimateSource.Prescription, estimate!.Source);
        Assert.Equal(2, estimate.SessionCount);
    }

    /// 2 exercises x 3 sets x 10 reps at 3s a rep = 30s of work per set, 90s of
    /// rest between sets, and one 60s changeover: 600 seconds exactly.
    [Fact]
    public void PrescriptionCountsWorkRestAndChangeovers()
    {
        var estimate = RoutineEstimator.For(
            RoutineWith(
                Reps(3, 10, ExerciseWeightType.External),
                Reps(3, 10, ExerciseWeightType.External)),
            Array.Empty<double>());

        Assert.Equal(RoutineEstimateSource.Prescription, estimate!.Source);
        Assert.Equal(10, estimate.Minutes);
    }

    /// A timed exercise is measured by its hold, not by a rep count it doesn't have.
    [Fact]
    public void TimedExercisesAreMeasuredByTheirHold()
    {
        // 3 x 60s of work plus 2 x 60s of rest = 300 seconds.
        var estimate = RoutineEstimator.For(RoutineWith(Timed(3, 60)), Array.Empty<double>());

        Assert.Equal(5, estimate!.Minutes);
    }

    [Fact]
    public void LoadedExercisesAssumeLongerRestThanBodyweightOnes()
    {
        var loaded = RoutineEstimator.For(
            RoutineWith(Reps(5, 10, ExerciseWeightType.External)), Array.Empty<double>());
        var bodyweight = RoutineEstimator.For(
            RoutineWith(Reps(5, 10, ExerciseWeightType.Bodyweight)), Array.Empty<double>());

        Assert.True(loaded!.Minutes > bodyweight!.Minutes);
    }

    /// Nobody plans a workout to the minute; a "37 min" reads more precise than
    /// this can honestly be.
    [Fact]
    public void RoundsToFiveMinutes()
    {
        var estimate = RoutineEstimator.For(
            RoutineWith(Reps(4, 12, ExerciseWeightType.External)),
            new List<double> { 47, 48, 52 });

        Assert.Equal(0, estimate!.Minutes % 5);
    }

    /// Rounding must not be able to produce "0 min" for a routine that exists.
    [Fact]
    public void NeverEstimatesNothingForARoutineWithWorkInIt()
    {
        var estimate = RoutineEstimator.For(
            RoutineWith(Reps(1, 1, ExerciseWeightType.Bodyweight)), Array.Empty<double>());

        Assert.True(estimate!.Minutes >= 5);
    }

    /// An empty routine takes no time, whatever its history says.
    [Fact]
    public void EmptyRoutineHasNoEstimate()
    {
        Assert.Null(RoutineEstimator.For(RoutineWith(), new List<double> { 60, 60, 60 }));
    }
}

/// The exclusions live in the query, so these need the real database.
[Collection(nameof(DatabaseCollection))]
public class RoutineEstimateQueryTests
{
    private readonly DatabaseFixture _fixture;

    public RoutineEstimateQueryTests(DatabaseFixture fixture) => _fixture = fixture;

    private static async Task<(Routine routine, Exercise exercise)> SeedRoutineAsync(
        AppDbContext db, string userId)
    {
        var exercise = new Exercise
        {
            Name = $"Test exercise {Guid.NewGuid():N}",
            Mode = ExerciseMode.Reps,
            WeightType = ExerciseWeightType.External,
            TargetMuscle = "Test",
            CreatedByUserId = userId,
        };
        db.Exercises.Add(exercise);

        var plan = new WorkoutPlan { UserId = userId, Name = "Test plan" };
        var routine = new Routine { Name = "Day 1", Order = 0 };
        routine.RoutineExercises.Add(new RoutineExercise
        {
            Exercise = exercise,
            Sets = 3,
            RepsPerSet = 10,
        });
        plan.Routines.Add(routine);
        db.WorkoutPlans.Add(plan);
        await db.SaveChangesAsync();

        return (routine, exercise);
    }

    private static async Task AddSessionsAsync(
        AppDbContext db, string userId, Guid routineId, Guid exerciseId,
        int count, double minutes, bool withLogs = true, bool completed = true)
    {
        for (var i = 0; i < count; i++)
        {
            var startedAt = DateTime.UtcNow.AddDays(-(i + 1));
            var session = new WorkoutSession
            {
                UserId = userId,
                RoutineId = routineId,
                RoutineName = "Day 1",
                StartedAt = startedAt,
                CompletedAt = completed ? startedAt.AddMinutes(minutes) : null,
            };
            db.WorkoutSessions.Add(session);
            await db.SaveChangesAsync();

            if (withLogs)
            {
                db.WorkoutLogs.Add(new WorkoutLog
                {
                    UserId = userId,
                    ExerciseId = exerciseId,
                    SessionId = session.Id,
                    CompletedAt = startedAt.AddMinutes(minutes),
                    ActualSets = 3,
                    ActualReps = 10,
                });
                await db.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task UsesHistoryOnceThereIsEnoughOfIt()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var (routine, exercise) = await SeedRoutineAsync(db, userId);

        await AddSessionsAsync(db, userId, routine.Id, exercise.Id, count: 3, minutes: 60);
        await RoutineEstimator.ApplyAsync(db, userId, new[] { routine });

        Assert.Equal(RoutineEstimateSource.History, routine.Estimate!.Source);
        Assert.Equal(60, routine.Estimate.Minutes);
    }

    /// Same rule the consistency stats use: tapping Start and walking away is
    /// not a workout, so it must not teach the estimate anything.
    [Fact]
    public async Task IgnoresSessionsWithNothingLogged()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var (routine, exercise) = await SeedRoutineAsync(db, userId);

        await AddSessionsAsync(
            db, userId, routine.Id, exercise.Id, count: 5, minutes: 200, withLogs: false);
        await RoutineEstimator.ApplyAsync(db, userId, new[] { routine });

        Assert.Equal(RoutineEstimateSource.Prescription, routine.Estimate!.Source);
    }

    /// A workout still in progress has no duration yet, only a start time.
    [Fact]
    public async Task IgnoresSessionsStillInProgress()
    {
        await using var db = _fixture.CreateContext();
        var userId = await TestContext.CreateUserAsync(db);
        var (routine, exercise) = await SeedRoutineAsync(db, userId);

        await AddSessionsAsync(
            db, userId, routine.Id, exercise.Id, count: 4, minutes: 60, completed: false);
        await RoutineEstimator.ApplyAsync(db, userId, new[] { routine });

        Assert.Equal(RoutineEstimateSource.Prescription, routine.Estimate!.Source);
    }

    /// Plans are private, but routines are addressable, so the estimate must be
    /// scoped to the asking user rather than to the routine alone.
    [Fact]
    public async Task DoesNotBorrowAnotherUsersSessions()
    {
        await using var db = _fixture.CreateContext();
        var owner = await TestContext.CreateUserAsync(db);
        var stranger = await TestContext.CreateUserAsync(db);
        var (routine, exercise) = await SeedRoutineAsync(db, owner);

        await AddSessionsAsync(db, stranger, routine.Id, exercise.Id, count: 5, minutes: 120);
        await RoutineEstimator.ApplyAsync(db, owner, new[] { routine });

        Assert.Equal(RoutineEstimateSource.Prescription, routine.Estimate!.Source);
    }
}
