namespace FitnessApi.Models;

public class WorkoutLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int ActualSets { get; set; }
    public int ActualReps { get; set; }
    public decimal? WeightUsedKg { get; set; }
}