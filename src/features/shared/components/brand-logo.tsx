import Image from "next/image";

export function BrandLogo({ width = 142, priority = false }: { width?: number; priority?: boolean }) {
  return <Image
    className="brand-logo"
    src="/dr-hair-logo.png"
    alt="Dr. Hair"
    width={1536}
    height={578}
    priority={priority}
    style={{ width, height: "auto" }}
  />;
}
