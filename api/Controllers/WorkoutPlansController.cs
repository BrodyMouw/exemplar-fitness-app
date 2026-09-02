using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;
using FitnessApi.Services;

namespace FitnessApi.Controllers;

[ApiController]
[Route("api/workoutplans")]
[Authorize]
public class WorkoutPlansController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkoutPlansController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    // Counts are projected in SQL rather than loading the routine graph, so the
    // list stays cheap while still giving the cards something to show.
    [HttpGet]
    public async Task<ActionResult<List<WorkoutPlanSummary>>> GetAll()
    {
        var plans = await _db.WorkoutPlans
            .Where(p => p.UserId == CurrentUserId)
            .OrderBy(p => p.Name)
            .Select(p => new WorkoutPlanSummary(
                p.Id,
                p.Name,
                p.Description,
                p.Routines.Count,
                p.Routines.SelectMany(r => r.RoutineExercises).Count()))
            .ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutPlan>> GetById(Guid id)
    {
        var plan = await _db.WorkoutPlans
            .Include(p => p.Routines.OrderBy(r => r.Order))
                .ThenInclude(r => r.RoutineExercises.OrderBy(re => re.Order))
                    .ThenInclude(re => re.Exercise)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

        // One query for the whole plan rather than one per training day.
        await RoutineEstimator.ApplyAsync(_db, CurrentUserId, plan.Routines);

        return Ok(plan);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutPlan>> Create(WorkoutPlanRequest request)
    {
        var plan = new WorkoutPlan
        {
            UserId = CurrentUserId,
            Name = request.Name,
            Description = request.Description,
        };

        // A plan covers one training week, so days-per-week is the routine count.
        // Seeded here rather than client-side so the plan and its routines land
        // in a single transaction.
        var days = Math.Clamp(request.DaysPerWeek ?? 0, 0, 7);
        for (var i = 0; i < days; i++)
        {
            plan.Routines.Add(new Routine
            {
                Name = $"Day {i + 1}",
                Order = i,
            });
        }

        _db.WorkoutPlans.Add(plan);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutPlan>> Update(Guid id, WorkoutPlanRequest request)
    {
        var plan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

        plan.Name = request.Name;
        plan.Description = request.Description;
        await _db.SaveChangesAsync();

        return Ok(plan);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

        _db.WorkoutPlans.Remove(plan);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record WorkoutPlanSummary(
    Guid Id,
    string Name,
    string? Description,
    int RoutineCount,
    int ExerciseCount);

// DaysPerWeek is only honored on create - it seeds that many named routines.
public record WorkoutPlanRequest(string Name, string? Description, int? DaysPerWeek = null);
