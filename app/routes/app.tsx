import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useLocation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const location = useLocation();

  const linkStyle = (path: string) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#111",
    background: location.pathname === path ? "#f0f0f0" : "transparent",
    fontWeight: location.pathname === path ? 700 : 400,
  });

  return (
    <AppProvider embedded apiKey={apiKey}>
      <div style={{ display: "flex", minHeight: "80vh", padding: 24, gap: 24 }}>
        <aside style={{ width: 220, borderRight: "1px solid #e5e5e5", paddingRight: 16 }}>
          <h3 style={{ marginTop: 0 }}>Rewardly Offline</h3>
          <nav style={{ display: "grid", gap: 6 }}>
            <Link to="/app" style={linkStyle("/app")}>Home</Link>
            <Link to="/app/submissions" style={linkStyle("/app/submissions")}>Tickets</Link>
          </nav>
        </aside>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};