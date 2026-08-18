export type ExerciseMode = "Reps" | "Time";
export type ExerciseWeightType = "Bodyweight" | "External";

export type Exercise = {
  id: string;
  name: string;
  description?: string;
  mode: ExerciseMode;
  weightType?: ExerciseWeightType;
  targetMuscle: string;
  // Present on the catalog endpoint; absent when an Exercise arrives nested
  // inside a RoutineExercise, which serializes the raw entity.
  isCustom?: boolean;
  isArchived?: boolean;
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

export type WeeklyCount = {
  weekStart: string;
  count: number;
};

export type ConsistencyStats = {
  totalWorkouts: number;
  workoutsThisWeek: number;
  weekStreak: number;
  weeklyCounts: WeeklyCount[];
};

export type ExerciseProgress = {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  metric: "Weight" | "Reps" | "Time";
  unit: string;
  first: number;
  latest: number;
  delta: number;
  sessionCount: number;
  lastPerformed: string;
};

export type HistoryPoint = {
  completedAt: string;
  value: number;
  sets: number;
};

export type ExerciseHistory = {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: string;
  metric: "Weight" | "Reps" | "Time";
  unit: string;
  points: HistoryPoint[];
};

export type WeightEntry = {
  id: string;
  weightKg: number;
  loggedOn: string;
  note?: string;
};

export type WorkoutLog = {
  id: string;
  // What was performed - kept even if the prescription below is deleted.
  exerciseId: string;
  // Null once the plan/routine/exercise this was logged against is removed.
  routineExerciseId?: string;
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
