import Link from "next/link";
import type { ContributionCell } from "@/lib/chama/picture";
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

export function MemberRegister({
  members,
  periodLabel,
  labels,
}: {
  members: RegisterMember[];
  periodLabel: string;
  labels: {
    member: string;
    savings: string;
    loan: string;
    arrears: string;
    mark: Record<ContributionCell, string>;
  };
}) {
  return (
    <section className="card mt-8 p-4">
      <h2 className="font-display text-2xl">{labels.member}</h2>
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
              <tr key={member.memberNo} className="border-t border-line">
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
    </section>
  );
}
