namespace FitnessApi.Models;

public enum RoutineEstimateSource
{
    // Derived from how long this routine has actually taken.
    History,

    // A guess from the prescription, used until there's enough history.
    Prescription,
}

// Never persisted - see Services/RoutineEstimator for why. SessionCount is
// carried so the UI can say what the number is based on rather than presenting
// a guess and a measurement identically.
public record RoutineEstimate(int Minutes, RoutineEstimateSource Source, int SessionCount);
