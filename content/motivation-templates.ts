export type MotivationSituation =
  | "loan_cleared"
  | "milestone"
  | "goal"
  | "paid_early"
  | "streak"
  | "growth"
  | "loan_half"
  | "due_soon"
  | "overdue"
  | "fine"
  | "anniversary"
  | "steady";

export type MotivationVars = {
  firstName: string;
  savings: string;
  milestone: string;
  months: string;
  goalName: string;
  goalPercent: string;
  amountLeft: string;
  streak: string;
  growth: string;
  loanPercent: string;
  loanLeft: string;
  amount: string;
  dueDate: string;
  fine: string;
  monthName: string;
  chamaName: string;
};

type Template = { id: string; en: string; sw: string };

export const motivationTemplates: Record<MotivationSituation, Template[]> = {
  loan_cleared: [
    { id: "loan_cleared_1", en: "Loan cleared, {firstName}. You paid back every shilling. Well done.", sw: "Mkopo umeisha, {firstName}. Umelipa kila senti. Hongera." },
    { id: "loan_cleared_2", en: "{firstName}, the loan is fully repaid. Your record is clear.", sw: "{firstName}, mkopo umelipwa wote. Daftari liko safi." },
    { id: "loan_cleared_3", en: "Every shilling of the loan is back, {firstName}. That is steady work.", sw: "Kila senti ya mkopo imerudi, {firstName}. Huo ni utaratibu." },
  ],
  milestone: [
    { id: "milestone_1", en: "You've passed KES {milestone} in savings. That's {months} months of steady effort.", sw: "Umezidi akiba ya KES {milestone}. Hiyo ni miezi {months} ya utaratibu." },
    { id: "milestone_2", en: "{firstName}, savings have crossed KES {milestone}. Keep the same pace.", sw: "{firstName}, akiba imevuka KES {milestone}. Endelea na kasi hiyo." },
    { id: "milestone_3", en: "KES {milestone} in savings is now behind you. The record shows the months.", sw: "KES {milestone} za akiba ziko nyuma yako. Daftari linaonyesha miezi." },
  ],
  goal: [
    { id: "goal_1", en: "{goalName} is {goalPercent}% there. KES {amountLeft} to go.", sw: "{goalName} imefika {goalPercent}%. Umebaki KES {amountLeft}." },
    { id: "goal_2", en: "{firstName}, {goalName} stands at {goalPercent}%. KES {amountLeft} remains.", sw: "{firstName}, {goalName} iko {goalPercent}%. Umebaki KES {amountLeft}." },
    { id: "goal_3", en: "The goal {goalName} is {goalPercent}% complete. KES {amountLeft} still to save.", sw: "Lengo {goalName} limekamilika {goalPercent}%. Bado KES {amountLeft}." },
  ],
  paid_early: [
    { id: "paid_early_1", en: "{monthName} paid early. Your savings now stand at KES {savings}.", sw: "{monthName} umelipa mapema. Akiba yako sasa ni KES {savings}." },
    { id: "paid_early_2", en: "Early this month, {firstName}. Savings are KES {savings}.", sw: "Umelipa mapema mwezi huu, {firstName}. Akiba ni KES {savings}." },
    { id: "paid_early_3", en: "{monthName} is already in the books. Savings: KES {savings}.", sw: "{monthName} tayari uko kwenye daftari. Akiba: KES {savings}." },
  ],
  streak: [
    { id: "streak_1", en: "{streak} months on time in a row. Consistency is your strength.", sw: "Miezi {streak} mfululizo kwa wakati. Utaratibu ndio nguvu yako." },
    { id: "streak_2", en: "{firstName}, {streak} months paid on time. The record is steady.", sw: "{firstName}, miezi {streak} umelipa kwa wakati. Daftari ni tulivu." },
    { id: "streak_3", en: "On time for {streak} months. That is how a balance grows.", sw: "Kwa wakati kwa miezi {streak}. Hivyo ndivyo salio linavyokua." },
  ],
  growth: [
    { id: "growth_1", en: "Your savings grew by KES {growth} in the last 3 months.", sw: "Akiba imeongezeka KES {growth} katika miezi 3 iliyopita." },
    { id: "growth_2", en: "{firstName}, the last 3 months added KES {growth} to savings.", sw: "{firstName}, miezi 3 iliyopita imeongeza KES {growth} kwenye akiba." },
    { id: "growth_3", en: "Savings are KES {growth} higher than 3 months ago.", sw: "Akiba ni KES {growth} zaidi ya miezi 3 iliyopita." },
  ],
  loan_half: [
    { id: "loan_half_1", en: "Your loan is {loanPercent}% repaid. KES {loanLeft} left.", sw: "Mkopo umelipwa {loanPercent}%. Umebaki KES {loanLeft}." },
    { id: "loan_half_2", en: "{firstName}, more than half the loan is repaid. KES {loanLeft} remains.", sw: "{firstName}, zaidi ya nusu ya mkopo umelipwa. Umebaki KES {loanLeft}." },
    { id: "loan_half_3", en: "The loan is {loanPercent}% complete. KES {loanLeft} still to pay.", sw: "Mkopo umekamilika {loanPercent}%. Bado KES {loanLeft}." },
  ],
  due_soon: [
    { id: "due_soon_1", en: "Your {monthName} contribution of KES {amount} is due on {dueDate}.", sw: "Mchango wako wa {monthName} wa KES {amount} unatakiwa tarehe {dueDate}." },
    { id: "due_soon_2", en: "{firstName}, KES {amount} for {monthName} is due on {dueDate}.", sw: "{firstName}, KES {amount} za {monthName} zinatakiwa tarehe {dueDate}." },
    { id: "due_soon_3", en: "{monthName} contribution, KES {amount}, is due on {dueDate}.", sw: "Mchango wa {monthName}, KES {amount}, unatakiwa tarehe {dueDate}." },
  ],
  overdue: [
    { id: "overdue_1", en: "A new week, a fresh start. Bringing {monthName} up to date keeps your record strong.", sw: "Wiki mpya, mwanzo mpya. Kukamilisha {monthName} kunaweka daftari imara." },
    { id: "overdue_2", en: "{firstName}, {monthName} is still open. A payment this week restores the month.", sw: "{firstName}, {monthName} bado wazi. Malipo wiki hii yanarejesha mwezi." },
    { id: "overdue_3", en: "There is still time to record {monthName}. Even a small payment counts.", sw: "Bado kuna wakati wa kuandika {monthName}. Hata malipo madogo yanahesabiwa." },
  ],
  fine: [
    { id: "fine_1", en: "Clearing your KES {fine} fine keeps your account fully up to date.", sw: "Kulipa faini ya KES {fine} kunaweka akaunti yako sawa." },
    { id: "fine_2", en: "{firstName}, a fine of KES {fine} is still open on the account.", sw: "{firstName}, faini ya KES {fine} bado iko kwenye akaunti." },
    { id: "fine_3", en: "The account still has a fine of KES {fine}. Paying it closes that line.", sw: "Akaunti bado ina faini ya KES {fine}. Kuilipa kunafunga mstari huo." },
  ],
  anniversary: [
    { id: "anniversary_1", en: "One year with {chamaName} today. You've saved KES {savings} since you joined.", sw: "Leo ni mwaka mmoja na {chamaName}. Umeweka KES {savings} tangu ujiunge." },
    { id: "anniversary_2", en: "{firstName}, this is your anniversary with {chamaName}. Savings stand at KES {savings}.", sw: "{firstName}, leo ni kumbukumbu yako na {chamaName}. Akiba ni KES {savings}." },
    { id: "anniversary_3", en: "A year in {chamaName}. The books show KES {savings} saved.", sw: "Mwaka mmoja katika {chamaName}. Daftari linaonyesha KES {savings} zilizowekwa." },
  ],
  steady: [
    { id: "steady_1", en: "Your savings: KES {savings}.", sw: "Akiba yako: KES {savings}." },
    { id: "steady_2", en: "{firstName}, the books show savings of KES {savings}.", sw: "{firstName}, daftari linaonyesha akiba ya KES {savings}." },
    { id: "steady_3", en: "Nothing new to flag today. Savings stand at KES {savings}.", sw: "Hakuna jipya leo. Akiba iko KES {savings}." },
  ],
};

export function fillTemplate(template: string, vars: MotivationVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key as keyof MotivationVars] ?? "");
}
