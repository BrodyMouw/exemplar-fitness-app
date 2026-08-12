using System.Text.Json.Serialization;

namespace FitnessApi.Models;

// The join between a Routine and a catalog Exercise, carrying the plan's
// prescription for it (sets, and either reps or time per set, plus target weight).
public class RoutineExercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoutineId { get; set; }

    [JsonIgnore]
    public Routine? Routine { get; set; }

    public Guid ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }

    public int Order { get; set; }
    public int Sets { get; set; }
    public int? RepsPerSet { get; set; }
    public int? TimePerSetSeconds { get; set; }
    public decimal? WeightKg { get; set; }
}
