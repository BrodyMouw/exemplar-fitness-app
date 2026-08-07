using FitnessApi.Data;
using FitnessApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessApi.Middleware;

// Clerk owns signup; this just makes sure a matching local User row exists
// so WeightEntry (and friends) have a foreign key to point at.
public class ClerkUserProvisioningMiddleware
{
    private readonly RequestDelegate _next;

    public ClerkUserProvisioningMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var clerkUserId = context.User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(clerkUserId))
            {
                var exists = await db.Users.AnyAsync(u => u.Id == clerkUserId);
                if (!exists)
                {
                    db.Users.Add(new User
                    {
                        Id = clerkUserId,
                        Email = context.User.FindFirst("email")?.Value ?? string.Empty,
                        DisplayName = context.User.FindFirst("name")?.Value ?? string.Empty,
                    });
                    await db.SaveChangesAsync();
                }
            }
        }

        await _next(context);
    }
}
