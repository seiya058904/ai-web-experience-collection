type PhotographProps = { name: "pavilion" | "fern" | "water" | "meadow"; alt?: string; priority?: boolean; className?: string };
export function Photograph({ name, alt = "", priority = false, className = "" }: PhotographProps) {
  return <picture className={`photograph ${className}`}>
    <source media="(max-width: 700px)" srcSet={`${import.meta.env.BASE_URL}verdant/images/${name}-960.webp 960w, /images/${name}-1672.webp 1672w`} sizes="100vw" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${import.meta.env.BASE_URL}verdant/images/${name}-1672.webp`} width="1672" height="941" alt={alt} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "low"} />
  </picture>;
}
