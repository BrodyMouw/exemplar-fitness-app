using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Authorize]
public class RoutinesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoutinesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    [HttpGet("api/routines/{id}")]
    public async Task<ActionResult<Routine>> GetById(Guid id)
    {
        var routine = await _db.Routines
            .Include(r => r.WorkoutPlan)
            .Include(r => r.RoutineExercises.OrderBy(re => re.Order))
                .ThenInclude(re => re.Exercise)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (routine is null || routine.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        return Ok(routine);
    }

    [HttpPost("api/workoutplans/{planId}/routines")]
    public async Task<ActionResult<Routine>> Create(Guid planId, RoutineRequest request)
    {
        var plan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

        var order = await _db.Routines.CountAsync(r => r.WorkoutPlanId == planId);

        var routine = new Routine
        {
            WorkoutPlanId = planId,
            Name = request.Name,
            WorkoutType = request.WorkoutType,
            EstimatedTimeMinutes = request.EstimatedTimeMinutes ?? 0,
            Order = order,
        };

        _db.Routines.Add(routine);
        await _db.SaveChangesAsync();

        return Ok(routine);
    }

    [HttpPut("api/routines/{id}")]
    public async Task<ActionResult<Routine>> Update(Guid id, RoutineRequest request)
    {
        var routine = await _db.Routines
            .Include(r => r.WorkoutPlan)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (routine is null || routine.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        routine.Name = request.Name;
        routine.WorkoutType = request.WorkoutType;
        // Not collected in the UI yet (estimated automatically later) - leave
        // any existing value alone rather than zeroing it out on every edit.
        routine.EstimatedTimeMinutes = request.EstimatedTimeMinutes ?? routine.EstimatedTimeMinutes;
        await _db.SaveChangesAsync();

        return Ok(routine);
    }

    [HttpDelete("api/routines/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var routine = await _db.Routines
            .Include(r => r.WorkoutPlan)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (routine is null || routine.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        _db.Routines.Remove(routine);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record RoutineRequest(string Name, string WorkoutType, int? EstimatedTimeMinutes = null);
