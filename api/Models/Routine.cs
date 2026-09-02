using System.ComponentModel.DataAnnotations.Schema;
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
    public int Order { get; set; }

    public List<RoutineExercise> RoutineExercises { get; set; } = new();

    // Computed per request, never stored: it depends on the prescription and on
    // the user's own session history, both of which move. Populated by the
    // endpoints that return routines; null when there's nothing to estimate.
    [NotMapped]
    public RoutineEstimate? Estimate { get; set; }
}
