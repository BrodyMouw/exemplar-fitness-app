using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Authorize]
public class RoutineExercisesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoutineExercisesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    private async Task<RoutineExercise?> LoadOwned(Guid id)
    {
        var routineExercise = await _db.RoutineExercises
            .Include(re => re.Routine)
                .ThenInclude(r => r!.WorkoutPlan)
            .Include(re => re.Exercise)
            .FirstOrDefaultAsync(re => re.Id == id);

        return routineExercise?.Routine?.WorkoutPlan?.UserId == CurrentUserId
            ? routineExercise
            : null;
    }

    [HttpPost("api/routines/{routineId}/exercises")]
    public async Task<ActionResult<RoutineExercise>> Create(Guid routineId, RoutineExerciseRequest request)
    {
        var routine = await _db.Routines
            .Include(r => r.WorkoutPlan)
            .FirstOrDefaultAsync(r => r.Id == routineId);

        if (routine is null || routine.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        var exerciseExists = await _db.Exercises.AnyAsync(e => e.Id == request.ExerciseId);
        if (!exerciseExists)
            return BadRequest("Unknown exercise.");

        var order = await _db.RoutineExercises.CountAsync(re => re.RoutineId == routineId);

        var routineExercise = new RoutineExercise
        {
            RoutineId = routineId,
            ExerciseId = request.ExerciseId,
            Sets = request.Sets,
            RepsPerSet = request.RepsPerSet,
            TimePerSetSeconds = request.TimePerSetSeconds,
            WeightKg = request.WeightKg,
            Order = order,
        };

        _db.RoutineExercises.Add(routineExercise);
        await _db.SaveChangesAsync();

        await _db.Entry(routineExercise).Reference(re => re.Exercise).LoadAsync();

        return Ok(routineExercise);
    }

    [HttpPut("api/routineexercises/{id}")]
    public async Task<ActionResult<RoutineExercise>> Update(Guid id, RoutineExerciseUpdateRequest request)
    {
        var routineExercise = await LoadOwned(id);
        if (routineExercise is null)
            return NotFound();

        routineExercise.Sets = request.Sets;
        routineExercise.RepsPerSet = request.RepsPerSet;
        routineExercise.TimePerSetSeconds = request.TimePerSetSeconds;
        routineExercise.WeightKg = request.WeightKg;
        await _db.SaveChangesAsync();

        return Ok(routineExercise);
    }

    [HttpDelete("api/routineexercises/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var routineExercise = await LoadOwned(id);
        if (routineExercise is null)
            return NotFound();

        _db.RoutineExercises.Remove(routineExercise);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record RoutineExerciseRequest(
    Guid ExerciseId,
    int Sets,
    int? RepsPerSet,
    int? TimePerSetSeconds,
    decimal? WeightKg);

public record RoutineExerciseUpdateRequest(
    int Sets,
    int? RepsPerSet,
    int? TimePerSetSeconds,
    decimal? WeightKg);
