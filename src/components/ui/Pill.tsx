import type { ReactNode } from "react";
import { PILL, cx } from "@/lib/ui-recipes";

interface Props {
  children: ReactNode;
  tone?: keyof typeof PILL.tone;
  size?: keyof typeof PILL.size;
  icon?: ReactNode;
  className?: string;
}

/**
 * A pill is a statement, not a control.
 *
 * None of the tones is the action fill. A gold pill would compete with the
 * one gold button on the page, and sixteen badge treatments existed partly
 * because nothing said what a badge was FOR.
 */
export default function Pill({ children, tone = "neutral", size = "sm", icon, className }: Props) {
  return (
    <span className={cx(PILL.base, PILL.tone[tone], PILL.size[size], className)}>
      {icon}
      {children}
    </span>
  );
}
