import test from "node:test"
import assert from "node:assert/strict"
import { evaluate } from "../lib/risk.ts"
import { scenarios, unknown } from "../lib/profile.ts"
import { POST } from "../app/api/risk/evaluate/route.ts"
const no = { pressure: false, caller: false, safe: false }
const yes = { pressure: true, caller: true, safe: true }
function post(body: string, type = "application/json") {
  return POST(new Request("http://local/api/risk/evaluate", { method: "POST", headers: { "Content-Type": type }, body }))
}
for (const [i, answers, score, level, action] of [
  [0, unknown, 0, "low", "SHOW_SUMMARY"], [1, unknown, 35, "medium", "ASK_CONTEXT"],
  [1, no, 35, "medium", "REVIEW_DETAILS"], [2, yes, 100, "high", "STOP_AND_VERIFY_WITH_BANK"]
] as const) test("API: " + action, async () => {
  const { recipient, amount } = scenarios[i]
  const input = { recipient, amount, answers }
  const response = await post(JSON.stringify(input))
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.deepEqual(result, evaluate(input))
  assert.equal(result.riskScore, score); assert.equal(result.riskLevel, level)
  assert.equal(result.recommendedAction, action)
  assert.equal(result.missingContext.length, answers === unknown ? 3 : 0)
})
test("Граница суммы строго выше тройной; причины соответствуют вводу", () => {
  const input = { recipient: "regular" as const, amount: 60000, answers: no }
  assert.deepEqual(evaluate(input).reasons, [])
  assert.deepEqual(evaluate({...input, amount: 60001}).reasons.map(r => r.code), ["AMOUNT"])
  assert.equal(evaluate({...input, answers: {...no, safe:true}}).recommendedAction, "STOP_AND_VERIFY_WITH_BANK")
})
test("Ошибки формата, объёма, типов и лишних полей", async () => {
  const input = { recipient:"regular", amount:1, answers:no }
  for (const bad of [{...input, amount:-1}, {...input, amount:"90"}, {...input, amount:10000001}, {...input, recipient:"other"}, {...input, phone:"123"}, {...input, answers:{} }])
    assert.equal((await post(JSON.stringify(bad))).status, 400)
  assert.equal((await post("{")).status, 400)
  assert.equal((await post(" ".repeat(2049))).status, 413)
  assert.equal((await post("{}", "text/plain")).status, 415)
})
