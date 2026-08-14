using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private const int WeeksShown = 8;

    private readonly AppDbContext _db;

    public StatsController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    private static DateOnly WeekStart(DateOnly date)
    {
        var offset = ((int)date.DayOfWeek + 6) % 7; // Monday-based
        return date.AddDays(-offset);
    }

    [HttpGet("consistency")]
    public async Task<ActionResult<ConsistencyStats>> GetConsistency()
    {
        // Left join: a log whose plan has since been deleted has no routine to
        // group by, but it still happened and still counts.
        var rows = await (
            from log in _db.WorkoutLogs
            where log.UserId == CurrentUserId
            join re in _db.RoutineExercises on log.RoutineExerciseId equals re.Id into matches
            from re in matches.DefaultIfEmpty()
            select new { log.CompletedAt, RoutineId = (Guid?)re.RoutineId })
            .ToListAsync();

        // There's no session entity, so a "workout" is derived: one routine
        // trained on one calendar date. Two different routines on the same day
        // count separately. Dates are resolved here rather than in SQL to keep
        // the query free of provider-specific date translation.
        var sessions = rows
            .Select(r => new
            {
                Date = DateOnly.FromDateTime(r.CompletedAt.ToUniversalTime()),
                r.RoutineId,
            })
            .Distinct()
            .ToList();

        var thisWeekStart = WeekStart(DateOnly.FromDateTime(DateTime.UtcNow));

        var countsByWeek = sessions
            .GroupBy(s => WeekStart(s.Date))
            .ToDictionary(g => g.Key, g => g.Count());

        var weeklyCounts = Enumerable.Range(0, WeeksShown)
            .Select(i => thisWeekStart.AddDays(-7 * (WeeksShown - 1 - i)))
            .Select(weekStart => new WeeklyCount(
                weekStart,
                countsByWeek.GetValueOrDefault(weekStart)))
            .ToList();

        // Consecutive weeks with at least one workout, counting back from this
        // one. Weekly rather than daily so rest days don't break the streak.
        // Bounded by the weeks that actually have data so it can't run away.
        var streak = 0;
        for (var week = thisWeekStart;
             countsByWeek.GetValueOrDefault(week) > 0;
             week = week.AddDays(-7))
        {
            streak++;
        }

        return Ok(new ConsistencyStats(
            sessions.Count,
            countsByWeek.GetValueOrDefault(thisWeekStart),
            streak,
            weeklyCounts));
    }

    [HttpGet("exercise-progress")]
    public async Task<ActionResult<List<ExerciseProgress>>> GetExerciseProgress()
    {
        // Joined straight to the catalog on the log's own ExerciseId - history
        // no longer depends on the prescription that produced it still existing.
        var logs = await (
            from log in _db.WorkoutLogs
            join ex in _db.Exercises on log.ExerciseId equals ex.Id
            where log.UserId == CurrentUserId
            select new
            {
                log.CompletedAt,
                log.ActualReps,
                log.ActualTimeSeconds,
                log.WeightUsedKg,
                ExerciseId = ex.Id,
                ExerciseName = ex.Name,
                ex.TargetMuscle,
                ex.Mode,
                ex.WeightType,
            })
            .ToListAsync();

        // Grouped in memory rather than in LINQ-to-SQL: far more readable, and
        // the log volume here is small. Revisit if that stops being true.
        var progress = logs
            .GroupBy(l => l.ExerciseId)
            .Select(group =>
            {
                var head = group.First();
                var (metric, unit) = MetricFor(head.Mode, head.WeightType);

                var points = group
                    .Select(l => new
                    {
                        l.CompletedAt,
                        Value = metric switch
                        {
                            "Weight" => l.WeightUsedKg,
                            "Reps" => (decimal?)l.ActualReps,
                            _ => (decimal?)l.ActualTimeSeconds,
                        },
                    })
                    .Where(p => p.Value.HasValue)
                    .OrderBy(p => p.CompletedAt)
                    .ToList();

                if (points.Count == 0) return null;

                var first = points[0].Value!.Value;
                var latest = points[^1].Value!.Value;

                return new ExerciseProgress(
                    head.ExerciseId,
                    head.ExerciseName,
                    head.TargetMuscle,
                    metric,
                    unit,
                    first,
                    latest,
                    latest - first,
                    points.Count,
                    points[^1].CompletedAt);
            })
            .OfType<ExerciseProgress>()
            .OrderByDescending(p => p.Delta)
            .ThenBy(p => p.ExerciseName)
            .ToList();

        return Ok(progress);
    }

    [HttpGet("exercise-progress/{exerciseId}")]
    public async Task<ActionResult<ExerciseHistory>> GetExerciseHistory(Guid exerciseId)
    {
        var logs = await (
            from log in _db.WorkoutLogs
            join ex in _db.Exercises on log.ExerciseId equals ex.Id
            where log.UserId == CurrentUserId && log.ExerciseId == exerciseId
            select new
            {
                log.CompletedAt,
                log.ActualSets,
                log.ActualReps,
                log.ActualTimeSeconds,
                log.WeightUsedKg,
                ExerciseName = ex.Name,
                ex.TargetMuscle,
                ex.Mode,
                ex.WeightType,
            })
            .ToListAsync();

        if (logs.Count == 0) return NotFound();

        var head = logs[0];
        var (metric, unit) = MetricFor(head.Mode, head.WeightType);

        var points = logs
            .Select(l => new
            {
                l.CompletedAt,
                l.ActualSets,
                Value = metric switch
                {
                    "Weight" => l.WeightUsedKg,
                    "Reps" => (decimal?)l.ActualReps,
                    _ => (decimal?)l.ActualTimeSeconds,
                },
            })
            .Where(p => p.Value.HasValue)
            .OrderBy(p => p.CompletedAt)
            .Select(p => new HistoryPoint(p.CompletedAt, p.Value!.Value, p.ActualSets))
            .ToList();

        if (points.Count == 0) return NotFound();

        return Ok(new ExerciseHistory(
            exerciseId,
            head.ExerciseName,
            head.TargetMuscle,
            metric,
            unit,
            points));
    }

    // Each exercise progresses on the number that actually matters for it, so
    // bodyweight and timed work isn't left blank.
    private static (string Metric, string Unit) MetricFor(
        ExerciseMode mode,
        ExerciseWeightType? weightType) =>
        mode == ExerciseMode.Time
            ? ("Time", "s")
            : weightType == ExerciseWeightType.External
                ? ("Weight", "kg")
                : ("Reps", "reps");
}

public record WeeklyCount(DateOnly WeekStart, int Count);

public record ConsistencyStats(
    int TotalWorkouts,
    int WorkoutsThisWeek,
    int WeekStreak,
    List<WeeklyCount> WeeklyCounts);

public record HistoryPoint(DateTime CompletedAt, decimal Value, int Sets);

public record ExerciseHistory(
    Guid ExerciseId,
    string ExerciseName,
    string TargetMuscle,
    string Metric,
    string Unit,
    List<HistoryPoint> Points);

public record ExerciseProgress(
    Guid ExerciseId,
    string ExerciseName,
    string TargetMuscle,
    string Metric,
    string Unit,
    decimal First,
    decimal Latest,
    decimal Delta,
    int SessionCount,
    DateTime LastPerformed);
