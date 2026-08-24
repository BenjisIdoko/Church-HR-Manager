import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Helper function mirroring ProtectedRoute decision logic
function evaluateProtectedRouteAccess({
  user,
  loadingSession,
  allow,
}: {
  user: { role: "superadmin" | "manager" | "member" } | null;
  loadingSession?: boolean;
  allow?: Array<"superadmin" | "manager" | "member">;
}) {
  if (loadingSession && !user) {
    return { action: "render_loading_spinner" };
  }
  if (!user) {
    return { action: "redirect", target: "/" };
  }
  if (allow && allow.length > 0 && !allow.includes(user.role)) {
    const defaultRoute =
      user.role === "superadmin"
        ? "/dashboard"
        : user.role === "manager"
        ? "/workers"
        : "/member";
    return { action: "redirect", target: defaultRoute };
  }
  return { action: "render_children" };
}

// Helper function mirroring ClockIn geofence distance calculation logic
function calculateGeofenceDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function evaluateGeofenceStatus(
  distanceMeters: number,
  radiusMeters: number,
  toleranceMeters: number
) {
  const maxAllowed = radiusMeters + toleranceMeters;
  const isWithin = distanceMeters <= maxAllowed;
  return {
    isWithin,
    maxAllowed,
    message: isWithin
      ? `Within boundary (${distanceMeters}m <= ${maxAllowed}m)`
      : `Outside geofence (${distanceMeters}m > ${maxAllowed}m)`,
  };
}

test("Frontend ProtectedRoute & Geofence UI Logic", async (t) => {
  await t.test("ProtectedRoute loading session renders loading indicator", () => {
    const res = evaluateProtectedRouteAccess({ user: null, loadingSession: true });
    assert.equal(res.action, "render_loading_spinner");
  });

  await t.test("ProtectedRoute unauthenticated user redirects to login (/)", () => {
    const res = evaluateProtectedRouteAccess({ user: null, loadingSession: false });
    assert.equal(res.action, "redirect");
    assert.equal(res.target, "/");
  });

  await t.test("ProtectedRoute unauthorized role redirects member to /member", () => {
    const res = evaluateProtectedRouteAccess({
      user: { role: "member" },
      allow: ["superadmin", "manager"],
    });
    assert.equal(res.action, "redirect");
    assert.equal(res.target, "/member");
  });

  await t.test("ProtectedRoute authorized superadmin renders route children", () => {
    const res = evaluateProtectedRouteAccess({
      user: { role: "superadmin" },
      allow: ["superadmin"],
    });
    assert.equal(res.action, "render_children");
  });

  await t.test("Geofence distance calculation & UI feedback evaluation", () => {
    const churchLat = 9.0765;
    const churchLng = 7.3986;

    // Position 100 meters away
    const nearLat = 9.0774;
    const nearLng = 7.3986;
    const distanceNear = calculateGeofenceDistance(churchLat, churchLng, nearLat, nearLng);
    const nearResult = evaluateGeofenceStatus(distanceNear, 200, 50);

    assert.equal(nearResult.isWithin, true);
    assert.equal(nearResult.maxAllowed, 250);

    // Position 1000 meters away
    const farLat = 9.0865;
    const farLng = 7.3986;
    const distanceFar = calculateGeofenceDistance(churchLat, churchLng, farLat, farLng);
    const farResult = evaluateGeofenceStatus(distanceFar, 200, 50);

    assert.equal(farResult.isWithin, false);
    assert.equal(farResult.maxAllowed, 250);
  });
});
