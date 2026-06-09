import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory } from "@/story-engine/load";
import { splitStory } from "@/story-engine/sanitize";
import { StoryPlayer } from "@/story-player/story-player";

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await getStory(slug);
  if (!raw) return notFound();

  // Candidate-safe trip (ground truth removed) + secrets for the author view / local scoring.
  const { candidate, secrets } = splitStory(raw);

  return (
    <>
      <StoryPlayer trip={candidate} secrets={secrets} />
      <noscript>
        <Link href="/">Back to trips</Link>
      </noscript>
    </>
  );
}
