"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContributionCell } from "@/lib/chama/picture";
import { bubbleSize } from "@/lib/chama/bubbles";
import { MonthPill } from "./month-pill";

export interface RegisterMember {
  memberNo: string;
  name: string;
  role: string;
  phoneMasked: string;
  savingsCents: number;
  savingsLabel: string;
  loanLabel: string;
  arrearsLabel: string;
  thisMonth: ContributionCell;
}

const FILL: Record<ContributionCell, string> = {
  PAID: "bg-leaf text-ivory",
  LATE: "bg-sisal text-ink",
  MISSED: "bg-clay text-ivory",
  NOT_DUE: "bg-ink/10 text-ink",
};

export function MemberRegister({
  members,
  periodLabel,
  labels,
}: {
  members: RegisterMember[];
  periodLabel: string;
  labels: {
    bubbles: string;
    table: string;
    member: string;
    savings: string;
    loan: string;
    arrears: string;
    mark: Record<ContributionCell, string>;
  };
}) {
  const [view, setView] = useState<"bubbles" | "table">("bubbles");
  const peak = Math.max(...members.map((member) => member.savingsCents), 1);
  const bubbles = [...members].sort((a, b) => b.savingsCents - a.savingsCents || a.memberNo.localeCompare(b.memberNo));

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{labels.member}</h2>
        <div className="flex gap-2">
          <button
            className={`tap rounded-full px-4 text-sm ${view === "bubbles" ? "bg-ink text-ivory" : "border border-ink/20"}`}
            type="button"
            onClick={() => setView("bubbles")}
          >
            {labels.bubbles}
          </button>
          <button
            className={`tap rounded-full px-4 text-sm ${view === "table" ? "bg-ink text-ivory" : "border border-ink/20"}`}
            type="button"
            onClick={() => setView("table")}
          >
            {labels.table}
          </button>
        </div>
      </div>
      {view === "bubbles" ? (
        <div className="mt-4 flex flex-wrap items-end justify-center gap-4">
          {bubbles.map((member) => {
            const size = bubbleSize(member.savingsCents, peak);
            const first = member.name.split(" ")[0];
            return (
              <Link
                key={member.memberNo}
                href={`/members/${member.memberNo}`}
                className="flex w-28 flex-col items-center text-center"
              >
                <span
                  className={`grid place-items-center rounded-full text-xs font-semibold ${FILL[member.thisMonth]}`}
                  style={{ width: size, height: size }}
                >
                  {member.memberNo}
                </span>
                <span className="mt-2 text-sm font-semibold">{first}</span>
                <span className="text-xs text-muted tabular-nums">{member.savingsLabel}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted">{labels.mark[member.thisMonth]}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 font-medium">{labels.member}</th>
                <th className="py-2 font-medium">{periodLabel}</th>
                <th className="py-2 font-medium">{labels.savings}</th>
                <th className="py-2 font-medium">{labels.loan}</th>
                <th className="py-2 font-medium">{labels.arrears}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.memberNo} className="border-t border-ink/10">
                  <td className="py-2">
                    <Link className="font-medium underline" href={`/members/${member.memberNo}`}>
                      {member.memberNo} {member.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {member.role} · {member.phoneMasked}
                    </p>
                  </td>
                  <td>
                    <MonthPill cell={member.thisMonth} label={labels.mark[member.thisMonth]} />
                  </td>
                  <td className="tabular-nums">{member.savingsLabel}</td>
                  <td className="tabular-nums">{member.loanLabel}</td>
                  <td className="tabular-nums">{member.arrearsLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
