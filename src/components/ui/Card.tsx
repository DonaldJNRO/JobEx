import type { ReactNode } from "react";
import { CARD, cx } from "@/lib/ui-recipes";

interface Props {
  children: ReactNode;
  tone?: keyof typeof CARD.tone;
  pad?: keyof typeof CARD.pad;
  elevated?: boolean;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

/** One radius and one border, against seven radii and eleven paddings. */
export default function Card({ children, tone = "card", pad = "md", elevated, className, as: Tag = "div" }: Props) {
  return (
    <Tag className={cx(CARD.base, CARD.tone[tone], CARD.pad[pad], elevated && CARD.elevated, className)}>
      {children}
    </Tag>
  );
}
