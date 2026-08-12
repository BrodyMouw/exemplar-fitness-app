using System.Text.Json.Serialization;

namespace FitnessApi.Models;

public class Routine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkoutPlanId { get; set; }

    [JsonIgnore]
    public WorkoutPlan? WorkoutPlan { get; set; }

    public string Name { get; set; } = string.Empty;
    public string WorkoutType { get; set; } = string.Empty;
    public int EstimatedTimeMinutes { get; set; }
    public int Order { get; set; }

    public List<RoutineExercise> RoutineExercises { get; set; } = new();
}
