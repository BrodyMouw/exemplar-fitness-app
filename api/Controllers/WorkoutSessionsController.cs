using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;
using FitnessApi.Models;

namespace FitnessApi.Controllers;

[ApiController]
[Authorize]
public class WorkoutSessionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkoutSessionsController(AppDbContext db)
    {
        _db = db;
    }

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    /// Start a workout, or pick up the one already in progress.
    ///
    /// Idempotent by design: the runner calls this every time it opens, and
    /// re-entering a routine you're midway through must not fork the workout
    /// into two - that would double the count and halve both durations.
    [HttpPost("api/routines/{routineId}/sessions")]
    public async Task<ActionResult<SessionWithLogs>> StartOrResume(Guid routineId)
    {
        var routine = await _db.Routines
            .Include(r => r.WorkoutPlan)
            .FirstOrDefaultAsync(r => r.Id == routineId);

        if (routine?.WorkoutPlan?.UserId != CurrentUserId)
            return NotFound();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var open = await _db.WorkoutSessions
            .Where(s => s.UserId == CurrentUserId
                && s.RoutineId == routineId
                && s.CompletedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (open is not null)
        {
            if (DateOnly.FromDateTime(open.StartedAt.ToUniversalTime()) == today)
                return Ok(await WithLogs(open));

            // Left open from a previous day - close it out at its last recorded
            // activity rather than letting it run forever, then start fresh.
            var lastLog = await _db.WorkoutLogs
                .Where(l => l.SessionId == open.Id)
                .MaxAsync(l => (DateTime?)l.CompletedAt);

            open.CompletedAt = lastLog ?? open.StartedAt;
            await _db.SaveChangesAsync();
        }

        var session = new WorkoutSession
        {
            UserId = CurrentUserId,
            RoutineId = routineId,
            RoutineName = routine.Name,
        };

        _db.WorkoutSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(await WithLogs(session));
    }

    [HttpPut("api/sessions/{id}/complete")]
    public async Task<ActionResult<WorkoutSession>> Complete(Guid id)
    {
        var session = await _db.WorkoutSessions.FirstOrDefaultAsync(s => s.Id == id);
        if (session is null || session.UserId != CurrentUserId)
            return NotFound();

        session.CompletedAt ??= DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(session);
    }

    // The runner restores its state from this, so the session and whatever has
    // already been logged into it travel together in one response.
    private async Task<SessionWithLogs> WithLogs(WorkoutSession session)
    {
        var logs = await _db.WorkoutLogs
            .Where(l => l.SessionId == session.Id)
            .OrderBy(l => l.CompletedAt)
            .ToListAsync();

        return new SessionWithLogs(session, logs);
    }
}

public record SessionWithLogs(WorkoutSession Session, List<WorkoutLog> Logs);
