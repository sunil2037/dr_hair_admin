export type AppScreen = "home" | "hair_test" | "products" | "videos" | "reviews" | "notifications" | "profile" | "orders" | "clinic_appointment";

export type AppDestination =
  | { type: "screen"; screen: AppScreen }
  | { type: "product"; entityId: string; fallback: "products" };

const screenRoutes: Record<AppScreen, string> = {
  home: "/",
  hair_test: "/hair-test",
  products: "/products",
  videos: "/videos",
  reviews: "/reviews",
  notifications: "/notifications",
  profile: "/profile",
  orders: "/orders",
  clinic_appointment: "/clinic-appointment",
};

export function destinationFromRoute(route: string): AppDestination | null {
  const screen = (Object.keys(screenRoutes) as AppScreen[]).find((key) => screenRoutes[key] === route);
  if (screen) return { type: "screen", screen };
  const product = /^\/products\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(route);
  return product ? { type: "product", entityId: product[1], fallback: "products" } : null;
}

export function routeForDestination(destination: AppDestination): string {
  if (destination.type === "product") {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destination.entityId)
      ? `/products/${encodeURIComponent(destination.entityId)}`
      : "/products";
  }
  return screenRoutes[destination.screen] ?? "/";
}
