using Microsoft.AspNetCore.Mvc;
using FitnessApi.Controllers;
using FitnessApi.Models;

namespace FitnessApi.Tests;

/// Every endpoint is scoped to the caller. These cover the cases where a
/// missing check would leak or mutate another user's data.
[Collection(nameof(DatabaseCollection))]
public class OwnershipTests
{
    private readonly DatabaseFixture _fixture;

    public OwnershipTests(DatabaseFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task GetPlan_AnotherUsersPlan_ReturnsNotFound()
    {
        await using var db = _fixture.CreateContext();
        var owner = await TestContext.CreateUserAsync(db);
        var intruder = await TestContext.CreateUserAsync(db);

        var plan = new WorkoutPlan { UserId = owner, Name = "Private plan" };
        db.WorkoutPlans.Add(plan);
        await db.SaveChangesAsync();

        var controller = new WorkoutPlansController(db);
        TestContext.Authenticate(controller, intruder);

        var result = await controller.GetById(plan.Id);

        // Not Forbid: a 404 avoids confirming the id even exists.
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetPlan_OwnPlan_ReturnsPlan()
    {
        await using var db = _fixture.CreateContext();
        var owner = await TestContext.CreateUserAsync(db);

        var plan = new WorkoutPlan { UserId = owner, Name = "My plan" };
        db.WorkoutPlans.Add(plan);
        await db.SaveChangesAsync();

        var controller = new WorkoutPlansController(db);
        TestContext.Authenticate(controller, owner);

        var result = await controller.GetById(plan.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(plan.Id, Assert.IsType<WorkoutPlan>(ok.Value).Id);
    }

    [Fact]
    public async Task UpdateExercise_SeededCatalogEntry_ReturnsNotFound()
    {
        await using var db = _fixture.CreateContext();
        var user = await TestContext.CreateUserAsync(db);

        // Seeded entries have no owner and are shared by everyone, so nobody
        // may rename them - not even a user who has them in a routine.
        var seeded = db.Exercises.First(e => e.CreatedByUserId == null);
        var originalName = seeded.Name;

        var controller = new ExercisesController(db);
        TestContext.Authenticate(controller, user);

        try
        {
            var result = await controller.Update(
                seeded.Id,
                new ExerciseRequest("Hijacked", null, ExerciseMode.Reps,
                    ExerciseWeightType.External, "Chest"));

            Assert.IsType<NotFoundResult>(result.Result);

            await using var verify = _fixture.CreateContext();
            Assert.Equal(originalName, verify.Exercises.First(e => e.Id == seeded.Id).Name);
        }
        finally
        {
            // The seeded catalog is shared by every test. If the guard under
            // test ever regresses, the rename above succeeds for real - so undo
            // it here rather than letting one failure cascade into unrelated
            // tests via poisoned fixture data.
            await using var repair = _fixture.CreateContext();
            var row = repair.Exercises.First(e => e.Id == seeded.Id);
            if (row.Name != originalName)
            {
                row.Name = originalName;
                await repair.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task Catalog_ExcludesAnotherUsersCustomExercise()
    {
        await using var db = _fixture.CreateContext();
        var owner = await TestContext.CreateUserAsync(db);
        var other = await TestContext.CreateUserAsync(db);

        db.Exercises.Add(new Exercise
        {
            Name = "Someone else's lift",
            Mode = ExerciseMode.Reps,
            WeightType = ExerciseWeightType.External,
            TargetMuscle = "Back",
            CreatedByUserId = owner,
        });
        await db.SaveChangesAsync();

        var controller = new ExercisesController(db);
        TestContext.Authenticate(controller, other);

        var result = await controller.GetAll();
        var catalog = Assert.IsType<List<ExerciseResponse>>(
            Assert.IsType<OkObjectResult>(result.Result).Value);

        Assert.DoesNotContain(catalog, e => e.Name == "Someone else's lift");
        // Seeded entries are still shared with everyone. Asserted structurally
        // rather than by name, so this doesn't depend on the seed contents.
        Assert.Contains(catalog, e => !e.IsCustom);
    }

    [Fact]
    public async Task Catalog_IncludesOwnCustomExercise()
    {
        await using var db = _fixture.CreateContext();
        var owner = await TestContext.CreateUserAsync(db);

        db.Exercises.Add(new Exercise
        {
            Name = "My own lift",
            Mode = ExerciseMode.Reps,
            WeightType = ExerciseWeightType.Bodyweight,
            TargetMuscle = "Core",
            CreatedByUserId = owner,
        });
        await db.SaveChangesAsync();

        var controller = new ExercisesController(db);
        TestContext.Authenticate(controller, owner);

        var result = await controller.GetAll();
        var catalog = Assert.IsType<List<ExerciseResponse>>(
            Assert.IsType<OkObjectResult>(result.Result).Value);

        var mine = Assert.Single(catalog, e => e.Name == "My own lift");
        Assert.True(mine.IsCustom);
    }
}
