"use client";

import { useEffect, useRef } from "react";

const workflowSteps = [
  {
    number: "01",
    title: "Describe the dataset",
    description: "Clients define the task, episode count, delivery deadline, and collection notes.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.7">
        <path d="M7 3.75h7l4.25 4.5v12H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
        <path d="M14 4v5h4M8.5 13h7M8.5 16.5h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Build the delivery",
    description: "Operators find eligible episodes, track assignment progress, and prepare a complete delivery.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.7">
        <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5v-9Z" strokeLinejoin="round" />
        <path d="m5.5 7.75 6.5 3.5 6.5-3.5M12 11.5V20M8.5 5.75l7 3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Review with confidence",
    description: "Clients accept the delivery or return it for rework with the request history kept in view.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.7">
        <path d="M12 3.5 19 6v5.3c0 4.5-2.8 7.6-7 9.2-4.2-1.6-7-4.7-7-9.2V6l7-2.5Z" strokeLinejoin="round" />
        <path d="m8.7 11.9 2.2 2.2 4.5-4.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function WorkflowSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return;
    }

    section.dataset.motionReady = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="workflow"
      aria-labelledby="workflow-title"
      className="workflow-section scroll-mt-24 overflow-hidden border-y border-slate-200 bg-[#fbfcfd]"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">A shared workflow</p>
          <h2 id="workflow-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Every handoff stays visible.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Keep clients and operations aligned from the first request through delivery review.
          </p>
        </div>

        <div className="relative mt-16 grid gap-5 md:grid-cols-3 md:gap-6">
          <div aria-hidden="true" className="workflow-orbit pointer-events-none absolute left-1/2 top-[-4.5rem] hidden size-[34rem] rounded-full border border-dashed border-slate-200 md:block" />
          <div aria-hidden="true" className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block" />
          {workflowSteps.map((step, index) => (
            <article
              key={step.number}
              className="workflow-step group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_35px_-26px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_45px_-30px_rgba(15,23,42,0.4)] sm:p-7"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <div className="relative z-10 mb-7 flex items-center justify-between">
                <div className="flex size-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-[0_0_0_8px_rgba(248,250,252,0.9)] transition duration-300 group-hover:scale-105 group-hover:border-amber-300 group-hover:bg-amber-50">
                  {step.icon}
                </div>
                <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold tracking-wide text-slate-500">{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              <div aria-hidden="true" className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-300 group-hover:w-20" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
