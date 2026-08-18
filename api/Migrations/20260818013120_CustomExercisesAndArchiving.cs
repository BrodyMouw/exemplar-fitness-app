using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApi.Migrations
{
    /// <inheritdoc />
    public partial class CustomExercisesAndArchiving : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Exercises",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ArchivedExercises",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArchivedExercises", x => new { x.UserId, x.ExerciseId });
                    table.ForeignKey(
                        name: "FK_ArchivedExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArchivedExercises_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000005"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000006"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000008"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000009"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000010"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000011"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000012"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000013"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000014"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000015"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000016"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000017"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000018"),
                column: "CreatedByUserId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_CreatedByUserId",
                table: "Exercises",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ArchivedExercises_ExerciseId",
                table: "ArchivedExercises",
                column: "ExerciseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Users_CreatedByUserId",
                table: "Exercises",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Users_CreatedByUserId",
                table: "Exercises");

            migrationBuilder.DropTable(
                name: "ArchivedExercises");

            migrationBuilder.DropIndex(
                name: "IX_Exercises_CreatedByUserId",
                table: "Exercises");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Exercises");
        }
    }
}
