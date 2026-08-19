using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Authorize]
public class WorkoutLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkoutLogsController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    [HttpPost("api/routineexercises/{routineExerciseId}/logs")]
    public async Task<ActionResult<WorkoutLog>> Create(
        Guid routineExerciseId,
        WorkoutLogRequest request)
    {
        var routineExercise = await _db.RoutineExercises
            .Include(re => re.Routine)
                .ThenInclude(r => r!.WorkoutPlan)
            .FirstOrDefaultAsync(re => re.Id == routineExerciseId);

        if (routineExercise?.Routine?.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        var log = new WorkoutLog
        {
            UserId = CurrentUserId,
            RoutineExerciseId = routineExerciseId,
            // Copied off the prescription so the log still knows what it was
            // if that prescription is later deleted.
            ExerciseId = routineExercise.ExerciseId,
            SessionId = request.SessionId,
            ActualSets = request.ActualSets,
            ActualReps = request.ActualReps,
            ActualTimeSeconds = request.ActualTimeSeconds,
            WeightUsedKg = request.WeightUsedKg,
        };

        _db.WorkoutLogs.Add(log);
        await _db.SaveChangesAsync();

        return Ok(log);
    }

    // The workout runner lets you step back to an exercise you already logged,
    // so corrections update the existing row instead of stacking duplicates.
    [HttpPut("api/workoutlogs/{id}")]
    public async Task<ActionResult<WorkoutLog>> Update(Guid id, WorkoutLogRequest request)
    {
        var log = await _db.WorkoutLogs.FirstOrDefaultAsync(l => l.Id == id);
        if (log is null || log.UserId != CurrentUserId)
            return NotFound();

        log.ActualSets = request.ActualSets;
        log.ActualReps = request.ActualReps;
        log.ActualTimeSeconds = request.ActualTimeSeconds;
        log.WeightUsedKg = request.WeightUsedKg;
        await _db.SaveChangesAsync();

        return Ok(log);
    }
}

public record WorkoutLogRequest(
    int ActualSets,
    int? ActualReps,
    int? ActualTimeSeconds,
    decimal? WeightUsedKg,
    Guid? SessionId = null);
