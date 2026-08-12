namespace FitnessApi.Models;

// Master exercise catalog - shared/seeded, not owned by any single user or plan.
public class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ExerciseMode Mode { get; set; }
    public ExerciseWeightType? WeightType { get; set; }
    public string TargetMuscle { get; set; } = string.Empty;
}
