namespace FitnessApi.Models;

public class WeightEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public decimal WeightKg { get; set; }
    public DateOnly LoggedOn { get; set; }
    public string? Note { get; set; }
}