import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/engine/load";
import { splitTrip } from "@/engine/sanitize";
import { TripPlayer } from "@/player/trip-player";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await getTrip(slug);
  if (!raw) return notFound();

  // Split into a candidate-safe trip (secrets stripped) + per-card secrets for the
  // author inspector. Both go to the client; the view toggle is a UX convenience.
  const { candidate, secrets } = splitTrip(raw);

  return (
    <>
      <TripPlayer trip={candidate} secrets={secrets} />
      <noscript>
        <Link href="/">Back to trips</Link>
      </noscript>
    </>
  );
}
