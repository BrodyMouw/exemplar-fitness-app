namespace FitnessApi.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string SubscriptionTier { get; set; } = "free";

    public List<WeightEntry> WeightEntries { get; set; } = new();
    public List<WorkoutPlan> WorkoutPlans { get; set; } = new();
}