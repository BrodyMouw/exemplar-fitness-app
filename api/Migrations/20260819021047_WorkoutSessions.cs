using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApi.Migrations
{
    /// <inheritdoc />
    public partial class WorkoutSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "WorkoutLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkoutSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoutineId = table.Column<Guid>(type: "uuid", nullable: true),
                    RoutineName = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Routines_RoutineId",
                        column: x => x.RoutineId,
                        principalTable: "Routines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Hand-written backfill: group pre-existing logs into sessions using
            // the same (user, routine, date) rule the stats used to derive a
            // "workout", so the totals already on screen don't move.
            //
            // The session id is computed from the grouping key rather than
            // random, so the UPDATE below can recompute the identical value and
            // match logs to sessions without a temporary column.
            migrationBuilder.Sql("""
                INSERT INTO "WorkoutSessions"
                    ("Id","UserId","RoutineId","RoutineName","StartedAt","CompletedAt")
                SELECT
                    md5(g."UserId" || coalesce(g."RoutineId"::text,'none') || g.d::text)::uuid,
                    g."UserId",
                    g."RoutineId",
                    coalesce(r."Name", 'Workout'),
                    g.first_at,
                    g.last_at
                FROM (
                    SELECT l."UserId",
                           re."RoutineId",
                           (l."CompletedAt" AT TIME ZONE 'UTC')::date AS d,
                           MIN(l."CompletedAt") AS first_at,
                           MAX(l."CompletedAt") AS last_at
                    FROM "WorkoutLogs" l
                    LEFT JOIN "RoutineExercises" re ON re."Id" = l."RoutineExerciseId"
                    GROUP BY l."UserId", re."RoutineId",
                             (l."CompletedAt" AT TIME ZONE 'UTC')::date
                ) g
                LEFT JOIN "Routines" r ON r."Id" = g."RoutineId";
                """);

            // Left join again so logs orphaned from a deleted plan are carried
            // across too, rather than silently left without a session.
            migrationBuilder.Sql("""
                UPDATE "WorkoutLogs" l
                SET "SessionId" = md5(
                    l."UserId" || coalesce(x."RoutineId"::text,'none')
                    || (l."CompletedAt" AT TIME ZONE 'UTC')::date::text
                )::uuid
                FROM (
                    SELECT wl."Id" AS log_id, re."RoutineId"
                    FROM "WorkoutLogs" wl
                    LEFT JOIN "RoutineExercises" re ON re."Id" = wl."RoutineExerciseId"
                ) x
                WHERE x.log_id = l."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutLogs_SessionId",
                table: "WorkoutLogs",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_RoutineId",
                table: "WorkoutSessions",
                column: "RoutineId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserId",
                table: "WorkoutSessions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutLogs_WorkoutSessions_SessionId",
                table: "WorkoutLogs",
                column: "SessionId",
                principalTable: "WorkoutSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutLogs_WorkoutSessions_SessionId",
                table: "WorkoutLogs");

            migrationBuilder.DropTable(
                name: "WorkoutSessions");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutLogs_SessionId",
                table: "WorkoutLogs");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "WorkoutLogs");
        }
    }
}
