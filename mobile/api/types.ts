export type ExerciseMode = "Reps" | "Time";
export type ExerciseWeightType = "Bodyweight" | "External";

export type Exercise = {
  id: string;
  name: string;
  description?: string;
  mode: ExerciseMode;
  weightType?: ExerciseWeightType;
  targetMuscle: string;
};

export type RoutineExercise = {
  id: string;
  routineId: string;
  exerciseId: string;
  exercise?: Exercise;
  order: number;
  sets: number;
  repsPerSet?: number;
  timePerSetSeconds?: number;
  weightKg?: number;
};

export type Routine = {
  id: string;
  workoutPlanId: string;
  name: string;
  workoutType: string;
  estimatedTimeMinutes: number;
  order: number;
  routineExercises: RoutineExercise[];
};

// Shape returned by GET /api/workoutplans - lighter than a full plan, with
// counts for the list cards.
export type WorkoutPlanSummary = {
  id: string;
  name: string;
  description?: string;
  routineCount: number;
  exerciseCount: number;
};

export type WorkoutLog = {
  id: string;
  routineExerciseId: string;
  completedAt: string;
  actualSets: number;
  actualReps?: number;
  actualTimeSeconds?: number;
  weightUsedKg?: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
  routines: Routine[];
};
