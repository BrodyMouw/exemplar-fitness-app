using System.Text.Json.Serialization;

namespace FitnessApi.Models;

// Master exercise catalog. Seeded entries are global and shared by everyone;
// users can also add their own, which stay private to them.
public class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ExerciseMode Mode { get; set; }
    public ExerciseWeightType? WeightType { get; set; }
    public string TargetMuscle { get; set; } = string.Empty;

    // Null marks a seeded/global entry - shared, and not editable by anyone.
    public string? CreatedByUserId { get; set; }

    [JsonIgnore]
    public User? CreatedByUser { get; set; }
}
