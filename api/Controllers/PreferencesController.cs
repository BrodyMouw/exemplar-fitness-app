using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Route("api/preferences")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PreferencesController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    [HttpGet]
    public async Task<ActionResult<PreferencesResponse>> Get()
    {
        // ClerkUserProvisioningMiddleware guarantees the row exists by the time
        // any authenticated request reaches a controller.
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user is null) return NotFound();

        return Ok(new PreferencesResponse(user.WeightUnit));
    }

    [HttpPut]
    public async Task<ActionResult<PreferencesResponse>> Update(PreferencesRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user is null) return NotFound();

        user.WeightUnit = request.WeightUnit;
        await _db.SaveChangesAsync();

        return Ok(new PreferencesResponse(user.WeightUnit));
    }
}

public record PreferencesResponse(WeightUnit WeightUnit);

public record PreferencesRequest(WeightUnit WeightUnit);
