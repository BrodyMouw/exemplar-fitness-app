using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitnessApi.Migrations
{
    /// <inheritdoc />
    public partial class DropStoredRoutineDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Duration is derived now (see Services/RoutineEstimator): it moves
            // when an exercise is added, when a prescription changes, and every
            // time the routine is trained. Nothing wrote this column from the
            // UI and nothing read it, so the values were 0 everywhere except a
            // single stray 5 left by an early test.
            migrationBuilder.DropColumn(
                name: "EstimatedTimeMinutes",
                table: "Routines");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EstimatedTimeMinutes",
                table: "Routines",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
