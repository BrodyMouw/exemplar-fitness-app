namespace FitnessApi.Models;

public class WorkoutPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public List<Exercise> Exercises { get; set; } = new();
}