using System.Text.Json.Serialization;

namespace FitnessApi.Models;

// Hides an exercise from one user's picker. Per-user rather than a flag on
// Exercise itself, so archiving a shared seeded entry can't hide it from
// everyone else.
public class ArchivedExercise
{
    public string UserId { get; set; } = string.Empty;

    [JsonIgnore]
    public User? User { get; set; }

    public Guid ExerciseId { get; set; }

    [JsonIgnore]
    public Exercise? Exercise { get; set; }
}
