using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FitnessApi.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    WeightType = table.Column<int>(type: "integer", nullable: true),
                    TargetMuscle = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubscriptionTier = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoutineExerciseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActualSets = table.Column<int>(type: "integer", nullable: false),
                    ActualReps = table.Column<int>(type: "integer", nullable: true),
                    ActualTimeSeconds = table.Column<int>(type: "integer", nullable: true),
                    WeightUsedKg = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WeightEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    WeightKg = table.Column<decimal>(type: "numeric", nullable: false),
                    LoggedOn = table.Column<DateOnly>(type: "date", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeightEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutPlans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Routines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkoutPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    WorkoutType = table.Column<string>(type: "text", nullable: false),
                    EstimatedTimeMinutes = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Routines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Routines_WorkoutPlans_WorkoutPlanId",
                        column: x => x.WorkoutPlanId,
                        principalTable: "WorkoutPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoutineExercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoutineId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Sets = table.Column<int>(type: "integer", nullable: false),
                    RepsPerSet = table.Column<int>(type: "integer", nullable: true),
                    TimePerSetSeconds = table.Column<int>(type: "integer", nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoutineExercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoutineExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoutineExercises_Routines_RoutineId",
                        column: x => x.RoutineId,
                        principalTable: "Routines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Exercises",
                columns: new[] { "Id", "Description", "Mode", "Name", "TargetMuscle", "WeightType" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), "Barbell press lying on a flat bench.", 0, "Bench Press", "Chest", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000002"), "Barbell back squat.", 0, "Squat", "Legs", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000003"), "Barbell deadlift from the floor.", 0, "Deadlift", "Back", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000004"), "Standing barbell press overhead.", 0, "Overhead Press", "Shoulders", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000005"), "Bent-over barbell row.", 0, "Barbell Row", "Back", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000006"), "Dumbbell or barbell curl.", 0, "Bicep Curl", "Arms", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000007"), "Overhead or cable tricep extension.", 0, "Tricep Extension", "Arms", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000008"), "Machine leg press.", 0, "Leg Press", "Legs", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000009"), "Cable lat pulldown.", 0, "Lat Pulldown", "Back", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000010"), "Walking or stationary dumbbell lunge.", 0, "Dumbbell Lunge", "Legs", 1 },
                    { new Guid("00000000-0000-0000-0000-000000000011"), "Standard bodyweight push-up.", 0, "Push-Up", "Chest", 0 },
                    { new Guid("00000000-0000-0000-0000-000000000012"), "Bodyweight pull-up.", 0, "Pull-Up", "Back", 0 },
                    { new Guid("00000000-0000-0000-0000-000000000013"), "Air squat, no added weight.", 0, "Bodyweight Squat", "Legs", 0 },
                    { new Guid("00000000-0000-0000-0000-000000000014"), "Parallel bar dip.", 0, "Dip", "Arms", 0 },
                    { new Guid("00000000-0000-0000-0000-000000000015"), "Standard bodyweight sit-up.", 0, "Sit-Up", "Core", 0 },
                    { new Guid("00000000-0000-0000-0000-000000000016"), "Timed front plank hold.", 1, "Plank", "Core", null },
                    { new Guid("00000000-0000-0000-0000-000000000017"), "Timed wall sit hold.", 1, "Wall Sit", "Legs", null },
                    { new Guid("00000000-0000-0000-0000-000000000018"), "Timed jump rope interval.", 1, "Jump Rope", "Cardio", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoutineExercises_ExerciseId",
                table: "RoutineExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_RoutineExercises_RoutineId",
                table: "RoutineExercises",
                column: "RoutineId");

            migrationBuilder.CreateIndex(
                name: "IX_Routines_WorkoutPlanId",
                table: "Routines",
                column: "WorkoutPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_WeightEntries_UserId",
                table: "WeightEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutPlans_UserId",
                table: "WorkoutPlans",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoutineExercises");

            migrationBuilder.DropTable(
                name: "WeightEntries");

            migrationBuilder.DropTable(
                name: "WorkoutLogs");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "Routines");

            migrationBuilder.DropTable(
                name: "WorkoutPlans");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
