using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WeightEntriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public WeightEntriesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    [HttpGet]
    public async Task<ActionResult<List<WeightEntry>>> GetAll()
    {
        var entries = await _db.WeightEntries
            .Where(w => w.UserId == CurrentUserId)
            .OrderByDescending(w => w.LoggedOn)
            .ToListAsync();
        return Ok(entries);
    }

    [HttpPost]
    public async Task<ActionResult<WeightEntry>> Create(WeightEntryRequest request)
    {
        var entry = new WeightEntry
        {
            UserId = CurrentUserId,
            WeightKg = request.WeightKg,
            LoggedOn = DateOnly.FromDateTime(DateTime.UtcNow),
            Note = request.Note
        };

        _db.WeightEntries.Add(entry);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = entry.Id }, entry);
    }
}

public record WeightEntryRequest(decimal WeightKg, string? Note);