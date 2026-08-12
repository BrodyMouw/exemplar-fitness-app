namespace FitnessApi.Models;

public class WorkoutLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid RoutineExerciseId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int ActualSets { get; set; }
    public int? ActualReps { get; set; }
    public int? ActualTimeSeconds { get; set; }
    public decimal? WeightUsedKg { get; set; }
}
