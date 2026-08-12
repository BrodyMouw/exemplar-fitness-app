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

    private async Task<bool> UserOwnsExercise(Guid exerciseId)
    {
        var exercise = await _db.Exercises
            .Include(e => e.WorkoutPlan)
            .FirstOrDefaultAsync(e => e.Id == exerciseId);
        return exercise is not null && exercise.WorkoutPlan?.UserId == CurrentUserId;
    }

    [HttpGet("api/exercises/{exerciseId}/logs")]
    public async Task<ActionResult<List<WorkoutLog>>> GetAll(Guid exerciseId)
    {
        if (!await UserOwnsExercise(exerciseId))
            return NotFound();

        var logs = await _db.WorkoutLogs
            .Where(l => l.ExerciseId == exerciseId && l.UserId == CurrentUserId)
            .OrderByDescending(l => l.CompletedAt)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost("api/exercises/{exerciseId}/logs")]
    public async Task<ActionResult<WorkoutLog>> Create(Guid exerciseId, WorkoutLogRequest request)
    {
        if (!await UserOwnsExercise(exerciseId))
            return NotFound();

        var log = new WorkoutLog
        {
            UserId = CurrentUserId,
            ExerciseId = exerciseId,
            ActualSets = request.ActualSets,
            ActualReps = request.ActualReps,
            WeightUsedKg = request.WeightUsedKg,
        };

        _db.WorkoutLogs.Add(log);
        await _db.SaveChangesAsync();

        return Ok(log);
    }
}

public record WorkoutLogRequest(int ActualSets, int ActualReps, decimal? WeightUsedKg);
