import { useSession } from "../session";
import { PageHeading } from "../components/Primitives";
import { TeamDirectory } from "../features/TeamDirectory";
import { AdminPeople } from "../features/AdminPeople";
export default function People() {
  const { session } = useSession();
  return (
    <>
      <PageHeading
        eyebrow={
          session?.capabilities.people_manage
            ? "PEOPLE & PERMISSIONS"
            : "THE PEOPLE BEHIND THE PROGRESS"
        }
        title={
          session?.capabilities.people_manage
            ? "The right people. The right access."
            : "A little closer to your team."
        }
        description={
          session?.capabilities.people_manage
            ? "Manage accounts, reporting relationships and workspace privileges."
            : "Make room for individual perspectives and shared growth."
        }
      />
      {session?.capabilities.people_manage ? (
        <AdminPeople />
      ) : (
        <TeamDirectory />
      )}
    </>
  );
}
