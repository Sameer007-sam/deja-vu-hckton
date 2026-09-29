import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function Info({ label, children }: { label: string; children: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`What is ${label}?`}
        className="inline-flex align-middle text-quiet transition-colors hover:text-spark focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <HelpCircle className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}
