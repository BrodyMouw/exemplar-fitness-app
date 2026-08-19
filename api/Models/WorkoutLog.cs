using System.Text.Json.Serialization;

namespace FitnessApi.Models;

public class WorkoutLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    [JsonIgnore]
    public User? User { get; set; }

    // What was actually performed, recorded independently of any plan so the
    // training history outlives the plan that prescribed it.
    public Guid ExerciseId { get; set; }

    [JsonIgnore]
    public Exercise? Exercise { get; set; }

    // The prescription this was logged against, if it still exists. Nulled out
    // when the plan/routine/exercise it came from is deleted.
    public Guid? RoutineExerciseId { get; set; }

    [JsonIgnore]
    public RoutineExercise? RoutineExercise { get; set; }

    // The session this was logged during. Nullable so a log outlives its
    // session the same way it outlives its plan.
    public Guid? SessionId { get; set; }

    [JsonIgnore]
    public WorkoutSession? Session { get; set; }

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int ActualSets { get; set; }
    public int? ActualReps { get; set; }
    public int? ActualTimeSeconds { get; set; }
    public decimal? WeightUsedKg { get; set; }
}
