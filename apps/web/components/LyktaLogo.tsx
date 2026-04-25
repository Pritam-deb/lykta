import Image from "next/image";
import icon from "@/app/icon.png";

export default function LyktaLogo({ small }: { small?: boolean }) {
  const s = small ? 20 : 28;
  return (
    <Image
      src={icon}
      alt="Lykta"
      width={s}
      height={s}
      style={{ borderRadius: 6 }}
    />
  );
}
