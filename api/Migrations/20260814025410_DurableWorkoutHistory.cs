using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApi.Migrations
{
    /// <inheritdoc />
    public partial class DurableWorkoutHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "RoutineExerciseId",
                table: "WorkoutLogs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            // Hand-edited: EF generates this column as NOT NULL with an
            // all-zeros default, which would stamp every existing log with a
            // non-existent exercise. Added nullable, backfilled from the
            // prescription each log was recorded against, then tightened.
            migrationBuilder.AddColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "WorkoutLogs" l
                SET "ExerciseId" = re."ExerciseId"
                FROM "RoutineExercises" re
                WHERE re."Id" = l."RoutineExerciseId";
                """);

            // Deliberately fails loudly if any row was left unbackfilled,
            // rather than silently admitting a bad exercise reference.
            migrationBuilder.AlterColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutLogs",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutLogs_ExerciseId",
                table: "WorkoutLogs",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutLogs_RoutineExerciseId",
                table: "WorkoutLogs",
                column: "RoutineExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutLogs_UserId",
                table: "WorkoutLogs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutLogs_Exercises_ExerciseId",
                table: "WorkoutLogs",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutLogs_RoutineExercises_RoutineExerciseId",
                table: "WorkoutLogs",
                column: "RoutineExerciseId",
                principalTable: "RoutineExercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutLogs_Users_UserId",
                table: "WorkoutLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutLogs_Exercises_ExerciseId",
                table: "WorkoutLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutLogs_RoutineExercises_RoutineExerciseId",
                table: "WorkoutLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutLogs_Users_UserId",
                table: "WorkoutLogs");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutLogs_ExerciseId",
                table: "WorkoutLogs");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutLogs_RoutineExerciseId",
                table: "WorkoutLogs");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutLogs_UserId",
                table: "WorkoutLogs");

            migrationBuilder.DropColumn(
                name: "ExerciseId",
                table: "WorkoutLogs");

            migrationBuilder.AlterColumn<Guid>(
                name: "RoutineExerciseId",
                table: "WorkoutLogs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
