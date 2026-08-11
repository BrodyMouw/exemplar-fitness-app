using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

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

    [HttpGet]
    public async Task<ActionResult<List<WorkoutPlan>>> GetAll()
    {
        var plans = await _db.WorkoutPlans
            .Where(p => p.UserId == CurrentUserId)
            .Select(p => new WorkoutPlan
            {
                Id = p.Id,
                UserId = p.UserId,
                Name = p.Name,
                Description = p.Description,
            })
            .ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutPlan>> GetById(Guid id)
    {
        var plan = await _db.WorkoutPlans
            .Include(p => p.Exercises.OrderBy(e => e.Order))
            .FirstOrDefaultAsync(p => p.Id == id);

        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

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

public record WorkoutPlanRequest(string Name, string? Description);
