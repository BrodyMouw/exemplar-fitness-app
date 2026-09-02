using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Services;

// How long a routine takes.
//
// Computed on read rather than stored. The answer changes when an exercise is
// added, when a prescription is edited, and every time the routine is trained;
// a column would have to be invalidated by all three and would be quietly wrong
// in between. This is the mirror image of the sessions decision - there, a fact
// that was being inferred became recorded; here, derived data stops pretending
// to be a fact.
public static class RoutineEstimator
{
    // Rough on purpose, and only load-bearing until the routine has been done
    // enough times to answer for itself.
    private const int SecondsPerRep = 3;
    private const int RestSecondsWeighted = 90;
    private const int RestSecondsBodyweight = 60;
    private const int TransitionSeconds = 60;

    // Three is the smallest sample where one unrepresentative session cannot be
    // the median: at one it *is* the answer, at two it drags the midpoint
    // halfway. This isn't hypothetical - a routine trained nine times at ~65
    // minutes also carries a 1-minute run-through, which is genuinely recorded
    // and useless as a prediction.
    private const int MinSessionsForHistory = 3;

    // Fills in Estimate for a batch of routines in one query, so a plan with
    // seven training days doesn't cost seven round trips.
    public static async Task ApplyAsync(
        AppDbContext db,
        string userId,
        IReadOnlyList<Routine> routines)
    {
        if (routines.Count == 0) return;

        var ids = routines.Select(r => r.Id).ToList();

        // The same exclusions the consistency stats apply: a session with
        // nothing logged isn't a workout, and only a completed one has a
        // duration to measure.
        var rows = await db.WorkoutSessions
            .Where(s => s.UserId == userId
                && s.RoutineId != null
                && ids.Contains(s.RoutineId.Value)
                && s.CompletedAt != null
                && db.WorkoutLogs.Any(l => l.SessionId == s.Id))
            .Select(s => new
            {
                RoutineId = s.RoutineId!.Value,
                Minutes = (s.CompletedAt!.Value - s.StartedAt).TotalMinutes,
            })
            .ToListAsync();

        var byRoutine = rows
            .Where(r => r.Minutes >= 0)
            .GroupBy(r => r.RoutineId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<double>)g.Select(r => r.Minutes).ToList());

        foreach (var routine in routines)
        {
            routine.Estimate = For(
                routine,
                byRoutine.GetValueOrDefault(routine.Id) ?? Array.Empty<double>());
        }
    }

    // Pure, so the interesting decisions are testable without a database.
    public static RoutineEstimate? For(Routine routine, IReadOnlyList<double> completedMinutes)
    {
        // An empty routine takes no time, whatever its history says.
        if (routine.RoutineExercises.Count == 0) return null;

        if (completedMinutes.Count >= MinSessionsForHistory)
        {
            return new RoutineEstimate(
                RoundToNearestFive(Median(completedMinutes)),
                RoutineEstimateSource.History,
                completedMinutes.Count);
        }

        return new RoutineEstimate(
            RoundToNearestFive(PrescribedSeconds(routine) / 60.0),
            RoutineEstimateSource.Prescription,
            completedMinutes.Count);
    }

    private static double PrescribedSeconds(Routine routine)
    {
        double seconds = 0;

        foreach (var item in routine.RoutineExercises)
        {
            var sets = Math.Max(item.Sets, 1);

            var work = item.TimePerSetSeconds
                ?? (item.RepsPerSet ?? 0) * SecondsPerRep;

            var rest = item.Exercise?.WeightType == ExerciseWeightType.External
                ? RestSecondsWeighted
                : RestSecondsBodyweight;

            // Rest happens between sets, not after the last one.
            seconds += sets * work + (sets - 1) * rest;
        }

        seconds += (routine.RoutineExercises.Count - 1) * TransitionSeconds;
        return seconds;
    }

    private static double Median(IReadOnlyList<double> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 1
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2.0;
    }

    // Nobody plans a workout to the minute, and a false precision like "37 min"
    // reads as more certain than this can be.
    private static int RoundToNearestFive(double minutes)
    {
        return Math.Max((int)(Math.Round(minutes / 5.0) * 5), 5);
    }
}
