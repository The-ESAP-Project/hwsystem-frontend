import { useEffect, useRef, useState } from "react";
import { FiFile } from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";
import { fileService } from "@/features/file/services/fileService";

interface ThumbnailImageProps {
  token: string;
  alt: string;
  className?: string;
}

export function ThumbnailImage({
  token,
  alt,
  className = "h-10 w-10 object-cover rounded",
}: ThumbnailImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const srcRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fileService
      .thumbnail(token)
      .then((url) => {
        if (!cancelled) {
          srcRef.current = url;
          setSrc(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      if (srcRef.current) {
        URL.revokeObjectURL(srcRef.current);
        srcRef.current = null;
      }
    };
  }, [token]);

  if (error) {
    return <FiFile className="h-6 w-6 text-muted-foreground" />;
  }

  if (!src) {
    return <Skeleton className={className} />;
  }

  return <img src={src} alt={alt} className={className} />;
}
