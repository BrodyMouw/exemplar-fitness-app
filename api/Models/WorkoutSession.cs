using System.Text.Json.Serialization;

namespace FitnessApi.Models;

// One trip through a routine. Logs attach to it, so a "workout" is a recorded
// fact rather than something reconstructed from log timestamps.
public class WorkoutSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    [JsonIgnore]
    public User? User { get; set; }

    // Nulled out if the plan is later deleted; the session itself survives.
    public Guid? RoutineId { get; set; }

    [JsonIgnore]
    public Routine? Routine { get; set; }

    // Snapshot taken at creation. Routines are plan-owned and deletable, and
    // unlike a logged exercise there's no permanent record to point at, so the
    // label has to be copied for the session to stay readable afterwards.
    public string RoutineName { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    // Null means still in progress.
    public DateTime? CompletedAt { get; set; }
}
