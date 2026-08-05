namespace FitnessApi.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string SubscriptionTier { get; set; } = "free";

    public List<WeightEntry> WeightEntries { get; set; } = new();
    public List<WorkoutPlan> WorkoutPlans { get; set; } = new();
}