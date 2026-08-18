import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { type Supporter } from "@/constants/types";
import { apiClient } from "@/lib/api-client";
import { revealTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MIN_LOGOS_PER_LAP = 8;
const SECONDS_PER_LOGO = 8;
const MIN_LAP_SECONDS = 30;

const LOGO_SPACING = "mx-4 sm:mx-6 md:mx-8";

const PAUSE_ON_INTERACTION = cn(
  "group-hover:[animation-play-state:paused]",
  "group-active:[animation-play-state:paused]",
  "group-focus-within:[animation-play-state:paused]"
);

function SupporterLogo({ supporter, duplicate }: { supporter: Supporter; duplicate: boolean }) {
  const logo = (
    <img
      src={supporter.logoUrl}
      alt={supporter.name}
      loading="lazy"
      className="h-12 w-auto max-w-40 object-contain transition-transform duration-200 ease-fluid group-hover/logo:scale-105 sm:h-16 sm:max-w-52 md:h-20 md:max-w-64"
    />
  );

  if (!supporter.websiteUrl) {
    return (
      <div className={cn("flex shrink-0 items-center px-3 py-3 sm:px-4", LOGO_SPACING)}>{logo}</div>
    );
  }

  return (
    <a
      href={supporter.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={supporter.name}
      tabIndex={duplicate ? -1 : undefined}
      className={cn(
        "group/logo relative flex shrink-0 items-center rounded-2xl px-3 py-3 transition-all duration-200 ease-fluid outline-none hover:-translate-y-1 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] sm:px-4",
        LOGO_SPACING
      )}
    >
      {logo}
      <ArrowUpRight className="absolute top-1 right-1 size-3.5 text-muted-foreground opacity-0 transition-opacity duration-200 ease-fluid group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100 sm:top-1.5 sm:right-1.5 sm:size-4" />
    </a>
  );
}

export function SupportersMarquee() {
  const { data: supporters = [] } = useQuery({
    queryKey: queryKeys.supporters(),
    queryFn: () => apiClient.get<Supporter[]>(ApiRoutes.SUPPORTERS),
    staleTime: Infinity,
  });

  if (supporters.length === 0) return null;

  const copiesPerLap = Math.ceil(MIN_LOGOS_PER_LAP / supporters.length);
  const copies = Array.from({ length: copiesPerLap * 2 }, (_, index) => index);
  const duration = `${Math.max(MIN_LAP_SECONDS, copiesPerLap * supporters.length * SECONDS_PER_LOGO)}s`;

  return (
    <section className="border-t py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={revealTransition(0)}
          className="mb-10 sm:mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 text-eyebrow text-primary uppercase">
            <span className="h-px w-6 bg-primary" />
            Supporters
          </div>
          <h2 className="text-title text-foreground">Those who support us</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={revealTransition(1)}
          className="group relative -mx-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none] sm:mx-0"
        >
          <div
            className={cn(
              "flex w-max animate-marquee items-center will-change-transform",
              PAUSE_ON_INTERACTION,
              "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-4"
            )}
            style={{ animationDuration: duration }}
          >
            {copies.map((copy) => (
              <div
                key={copy}
                aria-hidden={copy > 0}
                className={cn("flex shrink-0 items-center", copy > 0 && "motion-reduce:hidden")}
              >
                {supporters.map((supporter) => (
                  <SupporterLogo key={supporter.id} supporter={supporter} duplicate={copy > 0} />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
