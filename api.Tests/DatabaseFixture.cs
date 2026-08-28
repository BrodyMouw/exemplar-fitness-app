using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitnessApi.Data;

namespace FitnessApi.Tests;

/// Runs against a real PostgreSQL database rather than EF's in-memory
/// provider, which does not enforce foreign keys at all. Several of the
/// guarantees under test here - logs surviving a deleted plan, the catalog
/// resisting deletion - exist purely as FK delete behaviour, so an in-memory
/// suite would pass whether or not they actually worked.
///
/// Uses a separate database on the same container development uses, migrated
/// once for the whole run.
public class DatabaseFixture : IAsyncLifetime
{
    /// Defaults to the local development container so `dotnet test` needs no
    /// setup; CI overrides it to point at its own Postgres service.
    private static string ConnectionString =>
        Environment.GetEnvironmentVariable("FITNESS_TEST_DB")
        ?? "Host=localhost;Port=5432;Database=fitnessdb_test;Username=fitnessapp;Password=devpassword";

    public async Task InitializeAsync()
    {
        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options);
}

[CollectionDefinition(nameof(DatabaseCollection))]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>;

/// Shared helpers for tests that drive controllers directly.
public static class TestContext
{
    /// Every controller resolves identity from the "sub" claim and every query
    /// filters on it, so a unique user per test is all the isolation these
    /// tests need - no shared state to reset between them.
    public static string NewUserId() => $"user_test_{Guid.NewGuid():N}";

    public static void Authenticate(ControllerBase controller, string userId)
    {
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity(new[] { new Claim("sub", userId) }, "Test"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal },
        };
    }

    /// Mirrors what ClerkUserProvisioningMiddleware does on a real request.
    public static async Task<string> CreateUserAsync(AppDbContext db)
    {
        var userId = NewUserId();
        db.Users.Add(new Models.User
        {
            Id = userId,
            Email = $"{userId}@test.local",
            DisplayName = "Test User",
        });
        await db.SaveChangesAsync();
        return userId;
    }
}
