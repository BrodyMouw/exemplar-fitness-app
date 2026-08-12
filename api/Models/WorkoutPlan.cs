using System.Text.Json.Serialization;

namespace FitnessApi.Models;

public class WorkoutPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;

    [JsonIgnore]
    public User? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public List<Routine> Routines { get; set; } = new();
}