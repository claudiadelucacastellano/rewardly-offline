import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const submissions = await prisma.offlineSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { submissions };
}

export default function AdminSubmissionsPage() {
  const { submissions } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Tickets offline</h1>

      {submissions.length === 0 && <p>No hay tickets aún.</p>}

      <ul>
        {submissions.map((s) => (
          <li key={s.id}>
            {s.id} — {s.status}
          </li>
        ))}
      </ul>
    </div>
  );
}