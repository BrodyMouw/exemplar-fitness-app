using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

// Read-only browsing of the shared master exercise catalog.
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

    [HttpGet]
    public async Task<ActionResult<List<Exercise>>> GetAll()
    {
        var exercises = await _db.Exercises
            .OrderBy(e => e.Name)
            .ToListAsync();
        return Ok(exercises);
    }
}
