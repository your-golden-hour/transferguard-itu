"use client"
import { useState, type FormEvent } from "react"
import { scenarios, recipients, questions, unknown, type Answers, type Transfer } from "../lib/profile"
import type { evaluate } from "../lib/risk"
type Result = ReturnType<typeof evaluate>
const labels = { low: "Низкий риск", medium: "Повышенный риск", high: "Высокий риск" }
const advice = {
  SHOW_SUMMARY: "Проверьте имя получателя и сумму.",
  ASK_CONTEXT: "Ответьте на вопросы ниже, чтобы уточнить обстоятельства.",
  REVIEW_DETAILS: "Сверьте реквизиты и назначение перевода с вашей договорённостью.",
  STOP_AND_VERIFY_WITH_BANK: "Остановитесь. Завершите разговор и самостоятельно свяжитесь с банком через официальное приложение."
}
export default function Demo() {
  const [index, setIndex] = useState(0)
  const [amount, setAmount] = useState("12000")
  const [recipient, setRecipient] = useState<Transfer["recipient"]>("regular")
  const [answers, setAnswers] = useState<Answers>(unknown)
  const [context, setContext] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  function reset() { setAnswers(unknown); setContext(false); setResult(null); setError("") }
  function select(i: number) {
    reset(); setIndex(i); setAmount(String(scenarios[i].amount)); setRecipient(scenarios[i].recipient)
  }
  async function check(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("")
    try {
      const response = await fetch("/api/risk/evaluate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), recipient, answers }) })
      if (!response.ok) throw new Error()
      const assessment: Result = await response.json()
      setResult(assessment)
      if (assessment.recommendedAction === "ASK_CONTEXT") setContext(true)
    } catch { setError("Проверка недоступна. Попробуйте ещё раз."); setResult(null) }
    finally { setBusy(false) }
  }
  return <main><header><strong><span aria-hidden="true">◈</span> TransferGuard</strong><small>ITU Hackathon 2026</small></header>
    <h1>Проверка перевода</h1><p className="intro">Посмотрите, как обстоятельства перевода меняют рекомендацию.</p>
    <div className="columns"><aside><h2>Сценарии</h2><nav aria-label="Сценарии">{scenarios.map((s, i) =>
      <button key={s.title} disabled={busy} aria-pressed={i === index} onClick={() => select(i)}>{s.title}</button>)}</nav>
      <p>{scenarios[index].detail}</p><small>Демо на вымышленных данных. Реальные платежи отключены.</small></aside>
    <section><form onSubmit={check}><fieldset disabled={busy}><legend>Детали перевода</legend>
      <label>Получатель<select value={recipient} onChange={e => { reset(); setRecipient(e.target.value as Transfer["recipient"]) }}>
        {Object.entries(recipients).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
      <label>Сумма, ₸<input required type="number" min="1" max="10000000" step="1" value={amount} onChange={e => { reset(); setAmount(e.target.value) }} /></label>
      <small>Обычная сумма по демо-истории — 20 000 ₸.</small>
      {context ? <div><h2>Обстоятельства перевода</h2>{(Object.keys(questions) as (keyof Answers)[]).map(key =>
        <label key={key}>{questions[key]}<select value={String(answers[key])} onChange={e => { setResult(null); setAnswers({ ...answers, [key]: e.target.value === "null" ? null : e.target.value === "true" }) }}>
          <option value="null">Неизвестно</option><option value="true">Да</option><option value="false">Нет</option></select></label>)}</div>
      : <button className="text" type="button" onClick={() => { setContext(true); setResult(null) }}>Добавить обстоятельства перевода</button>}
      <button className="primary">{busy ? "Проверяем…" : "Проверить перевод"}</button></fieldset></form>
      <div aria-live="polite">{error && <p role="alert">{error}</p>}{result && <article data-level={result.riskLevel}><small>Результат проверки</small><h2>{labels[result.riskLevel]}</h2>
        <p>{advice[result.recommendedAction]}</p>{result.reasons.length > 0 && <ul>{result.reasons.map(r => <li key={r.code}>{r.text}</li>)}</ul>}
        <small>{result.riskScore} из 100 по демо-шкале.{result.missingContext.length > 0 && " Часть контекста неизвестна."}</small></article>}</div>
    </section></div></main>
}
