import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import { timeAgo } from "@/lib/utils";
import { Star } from "lucide-react";

export type ReviewViewData = {
  overall: number;
  handwriting: number;
  accuracy: number;
  neatness: number;
  communication: number;
  onTime: number;
  text: string;
  createdAt: Date;
  studentName: string;
  studentAvatarUrl: string | null;
};

const ROWS: Array<{ key: keyof ReviewViewData; label: string }> = [
  { key: "handwriting", label: "Handwriting" },
  { key: "accuracy", label: "Accuracy" },
  { key: "neatness", label: "Neatness" },
  { key: "communication", label: "Communication" },
  { key: "onTime", label: "On-time" },
];

/** Read-only display of the review left on a completed order. */
export default function ReviewView({ review }: { review: ReviewViewData }) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-950">Review</h2>
        <span className="pill bg-amber-50 text-amber-700">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {review.overall}/5 overall
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-500">{r.label}</span>
            <RatingStars value={review[r.key] as number} size={13} />
          </div>
        ))}
      </div>
      {review.text && (
        <blockquote className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-sm leading-relaxed text-ink-700">
          “{review.text}”
        </blockquote>
      )}
      <div className="mt-4 flex items-center gap-2.5 border-t border-ink-100 pt-4">
        <Avatar name={review.studentName} url={review.studentAvatarUrl} size={28} />
        <div className="text-xs">
          <p className="font-medium text-ink-800">{review.studentName}</p>
          <p className="text-ink-400">{timeAgo(review.createdAt)}</p>
        </div>
      </div>
    </section>
  );
}
