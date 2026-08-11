using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Authorize]
public class ExercisesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ExercisesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    [HttpPost("api/workoutplans/{planId}/exercises")]
    public async Task<ActionResult<Exercise>> Create(Guid planId, ExerciseRequest request)
    {
        var plan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan is null || plan.UserId != CurrentUserId)
            return NotFound();

        var order = await _db.Exercises.CountAsync(e => e.WorkoutPlanId == planId);

        var exercise = new Exercise
        {
            WorkoutPlanId = planId,
            Name = request.Name,
            Sets = request.Sets,
            Reps = request.Reps,
            Order = order,
        };

        _db.Exercises.Add(exercise);
        await _db.SaveChangesAsync();

        return Ok(exercise);
    }

    [HttpPut("api/exercises/{id}")]
    public async Task<ActionResult<Exercise>> Update(Guid id, ExerciseRequest request)
    {
        var exercise = await _db.Exercises
            .Include(e => e.WorkoutPlan)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exercise is null || exercise.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        exercise.Name = request.Name;
        exercise.Sets = request.Sets;
        exercise.Reps = request.Reps;
        await _db.SaveChangesAsync();

        return Ok(exercise);
    }

    [HttpDelete("api/exercises/{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var exercise = await _db.Exercises
            .Include(e => e.WorkoutPlan)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exercise is null || exercise.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        _db.Exercises.Remove(exercise);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record ExerciseRequest(string Name, int Sets, int Reps);
