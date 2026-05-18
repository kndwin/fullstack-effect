const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN ?? "https://backend.fullstack-effect.localhost";

export const backendUrl = (path: string): string => `${backendOrigin}${path}`;
