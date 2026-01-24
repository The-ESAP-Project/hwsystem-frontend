import { RouterProvider } from "react-router";
import { Providers } from "./app/providers";
import { router } from "./app/router";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  );
}
