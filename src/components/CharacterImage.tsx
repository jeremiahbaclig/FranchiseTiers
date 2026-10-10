import { useLayoutEffect, useRef, useState } from "react";

interface CharacterImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

/** Image with a loading state and a graceful fallback when the source is missing or fails. */
export function CharacterImage({ src, alt, className }: CharacterImageProps) {
  return <CharacterImageInner key={src} src={src} alt={alt} className={className} />;
}

function CharacterImageInner({ src, alt, className }: CharacterImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cached images can finish loading before React attaches the onLoad listener, so check directly.
  useLayoutEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (!src || failed) {
    return (
      <div className={`character-image character-image--placeholder ${className ?? ""}`} role="img" aria-label={alt}>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <div className={`character-image ${className ?? ""}`}>
      {!loaded && <div className="character-image__skeleton" aria-hidden="true" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`character-image__img ${loaded ? "character-image__img--loaded" : ""}`}
      />
    </div>
  );
}
