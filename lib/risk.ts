import { typicalAmount, type Transfer } from "./profile.ts"

export function evaluate({ amount, recipient, answers }: Transfer) {
  const reasons: { code: string, text: string, points: number }[] = []
  const add = (code: string, text: string, points: number) => reasons.push({ code, text, points })
  if (recipient === "new") add("NEW", "Первый перевод этому получателю", 15)
  if (amount > 3 * typicalAmount) add("AMOUNT", "Сумма более чем втрое выше обычной", 20)
  if (answers.pressure) add("PRESSURE", "Вас торопят или просят о секретности", 20)
  if (answers.caller) add("CALLER", "Звонящий представился сотрудником банка", 15)
  if (answers.safe) add("SAFE", "Предложен перевод на «безопасный счёт»", 35)
  const riskScore = Math.min(100, reasons.reduce((sum, reason) => sum + reason.points, 0))
  const riskLevel: "low" | "medium" | "high" = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low"
  const missingContext = Object.entries(answers).filter(([, value]) => value === null).map(([key]) => key)
  const recommendedAction: "STOP_AND_VERIFY_WITH_BANK" | "ASK_CONTEXT" | "REVIEW_DETAILS" | "SHOW_SUMMARY" = riskLevel === "high" || answers.safe ? "STOP_AND_VERIFY_WITH_BANK"
    : riskLevel === "medium" && missingContext.length ? "ASK_CONTEXT"
    : riskLevel === "medium" ? "REVIEW_DETAILS" : "SHOW_SUMMARY"
  return { riskScore, riskLevel, reasons, missingContext, recommendedAction, modelVersion: "rules-v0.1", isDemo: true } as const
}

