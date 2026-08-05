namespace FitnessApi.Models;

public class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkoutPlanId { get; set; }
    public WorkoutPlan? WorkoutPlan { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int Order { get; set; }
}