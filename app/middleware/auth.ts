export default defineNuxtRouteMiddleware((to, from) => {
  const { userId } = useAuth();

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/works/register",
    "/marketplace/services/create",
    "/messages",
  ];

  const isProtected = protectedRoutes.some((route) =>
    to.path.startsWith(route)
  );

  if (isProtected && !userId.value) {
    return navigateTo("/");
  }
});
