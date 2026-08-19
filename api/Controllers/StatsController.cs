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
        // A workout is now a recorded session rather than something inferred
        // from log timestamps. Sessions with nothing logged are excluded, so
        // tapping Start and walking away doesn't inflate the count.
        var rows = await _db.WorkoutSessions
            .Where(s => s.UserId == CurrentUserId
                && _db.WorkoutLogs.Any(l => l.SessionId == s.Id))
            .Select(s => new { s.StartedAt, s.CompletedAt })
            .ToListAsync();

        var sessions = rows
            .Select(s => new
            {
                Date = DateOnly.FromDateTime(s.StartedAt.ToUniversalTime()),
            })
            .ToList();

        // Only completed sessions have a meaningful duration.
        var durations = rows
            .Where(s => s.CompletedAt != null)
            .Select(s => (s.CompletedAt!.Value - s.StartedAt).TotalMinutes)
            .Where(m => m >= 0)
            .ToList();

        var averageDuration = durations.Count > 0
            ? (int)Math.Round(durations.Average())
            : (int?)null;

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
            averageDuration,
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
    int? AverageDurationMinutes,
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
