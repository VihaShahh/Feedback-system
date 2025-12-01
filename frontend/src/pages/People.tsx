import { PageHeading } from "../components/Primitives";
import { TeamDirectory } from "../features/TeamDirectory";
export default function People() {
  return (
    <>
      <PageHeading
        eyebrow="THE PEOPLE BEHIND THE PROGRESS"
        title="A little closer to your team."
        description="Make room for individual perspectives and shared growth."
      />
      <TeamDirectory />
    </>
  );
}
