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

export type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
  routines: Routine[];
};
