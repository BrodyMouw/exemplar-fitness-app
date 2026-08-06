using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeightEntriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly Guid TestUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public WeightEntriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<WeightEntry>>> GetAll()
    {
        var entries = await _db.WeightEntries
            .Where(w => w.UserId == TestUserId)
            .OrderByDescending(w => w.LoggedOn)
            .ToListAsync();
        return Ok(entries);
    }

    [HttpPost]
    public async Task<ActionResult<WeightEntry>> Create(WeightEntryRequest request)
    {
        var entry = new WeightEntry
        {
            UserId = TestUserId,
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