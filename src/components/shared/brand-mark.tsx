import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/branding/santra-logo.png"
      alt=""
      aria-hidden="true"
      width={78}
      height={52}
      sizes="(max-width: 768px) 78px, 168px"
      className={cn(
        "h-[52px] w-[78px] object-contain transition duration-300 ease-out",
        className,
      )}
      priority
    />
  );
}
