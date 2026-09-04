import { avatarHue, initials } from "@/lib/utils";

export default function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = avatarHue(name);
  return (
    <span
      className="flex shrink-0 select-none items-center justify-center rounded-full font-script font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 50% 32%))`,
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
