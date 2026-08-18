using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

// The shared master catalog plus each user's own private additions.
[ApiController]
[Route("api/exercises")]
[Authorize]
public class ExercisesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ExercisesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    /// Seeded entries (no owner) plus the caller's own. Never anyone else's.
    private IQueryable<Exercise> VisibleExercises =>
        _db.Exercises.Where(e =>
            e.CreatedByUserId == null || e.CreatedByUserId == CurrentUserId);

    [HttpGet]
    public async Task<ActionResult<List<ExerciseResponse>>> GetAll(
        [FromQuery] bool includeArchived = false)
    {
        var archivedIds = await _db.ArchivedExercises
            .Where(a => a.UserId == CurrentUserId)
            .Select(a => a.ExerciseId)
            .ToListAsync();

        var query = VisibleExercises;
        if (!includeArchived)
            query = query.Where(e => !archivedIds.Contains(e.Id));

        var exercises = await query.OrderBy(e => e.Name).ToListAsync();

        return Ok(exercises
            .Select(e => ExerciseResponse.From(e, CurrentUserId, archivedIds.Contains(e.Id)))
            .ToList());
    }

    [HttpPost]
    public async Task<ActionResult<ExerciseResponse>> Create(ExerciseRequest request)
    {
        var exercise = new Exercise
        {
            Name = request.Name,
            Description = request.Description,
            Mode = request.Mode,
            // Only meaningful for rep-based work; a timed exercise has no
            // weight type at all.
            WeightType = request.Mode == ExerciseMode.Time ? null : request.WeightType,
            TargetMuscle = request.TargetMuscle,
            CreatedByUserId = CurrentUserId,
        };

        _db.Exercises.Add(exercise);
        await _db.SaveChangesAsync();

        return Ok(ExerciseResponse.From(exercise, CurrentUserId, false));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExerciseResponse>> Update(Guid id, ExerciseRequest request)
    {
        var exercise = await _db.Exercises.FirstOrDefaultAsync(e => e.Id == id);

        // Seeded entries are shared, so nobody edits them - including their
        // "owner", which is nobody.
        if (exercise is null || exercise.CreatedByUserId != CurrentUserId)
            return NotFound();

        exercise.Name = request.Name;
        exercise.Description = request.Description;
        exercise.Mode = request.Mode;
        exercise.WeightType = request.Mode == ExerciseMode.Time ? null : request.WeightType;
        exercise.TargetMuscle = request.TargetMuscle;
        await _db.SaveChangesAsync();

        var archived = await _db.ArchivedExercises
            .AnyAsync(a => a.UserId == CurrentUserId && a.ExerciseId == id);

        return Ok(ExerciseResponse.From(exercise, CurrentUserId, archived));
    }

    [HttpPost("{id}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var exists = await VisibleExercises.AnyAsync(e => e.Id == id);
        if (!exists) return NotFound();

        var already = await _db.ArchivedExercises
            .AnyAsync(a => a.UserId == CurrentUserId && a.ExerciseId == id);

        if (!already)
        {
            _db.ArchivedExercises.Add(new ArchivedExercise
            {
                UserId = CurrentUserId,
                ExerciseId = id,
            });
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("{id}/archive")]
    public async Task<IActionResult> Unarchive(Guid id)
    {
        var row = await _db.ArchivedExercises
            .FirstOrDefaultAsync(a => a.UserId == CurrentUserId && a.ExerciseId == id);

        if (row is not null)
        {
            _db.ArchivedExercises.Remove(row);
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }
}

public record ExerciseResponse(
    Guid Id,
    string Name,
    string? Description,
    ExerciseMode Mode,
    ExerciseWeightType? WeightType,
    string TargetMuscle,
    bool IsCustom,
    bool IsArchived)
{
    public static ExerciseResponse From(Exercise e, string userId, bool isArchived) =>
        new(e.Id, e.Name, e.Description, e.Mode, e.WeightType, e.TargetMuscle,
            e.CreatedByUserId == userId, isArchived);
}

public record ExerciseRequest(
    string Name,
    string? Description,
    ExerciseMode Mode,
    ExerciseWeightType? WeightType,
    string TargetMuscle);
