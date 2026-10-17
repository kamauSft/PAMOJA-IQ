import Image from "next/image";

export function ScenePhoto({
  name,
  alt,
  priority = false,
  tall = false,
  children,
}: {
  name: "chama-meeting" | "treasurer-desk" | "member-morning";
  alt: string;
  priority?: boolean;
  tall?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative w-full overflow-hidden ${tall ? "min-h-[70vh]" : "h-40 sm:h-[220px]"}`}>
      <Image
        src={`/images/${name}-phone.webp`}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover sm:hidden"
      />
      <Image
        src={`/images/${name}-desktop.webp`}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="hidden object-cover sm:block"
      />
      <div className="absolute inset-0 bg-[#0F2A3D]/70" />
      {children ? <div className="absolute inset-0 flex items-end p-5 sm:p-8">{children}</div> : null}
    </div>
  );
}
