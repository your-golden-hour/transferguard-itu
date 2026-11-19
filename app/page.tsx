"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { scenarios, recipients, questions, unknown, type Answers, type Transfer } from "../lib/profile"
import type { evaluate } from "../lib/risk"

type Result = ReturnType<typeof evaluate>
type Screen = "transfer" | "review" | "context" | "warning" | "complete" | "cancelled"
const money = new Intl.NumberFormat("ru-KZ")
const questionKeys = Object.keys(questions) as (keyof Answers)[]

export default function Demo() {
  const [index, setIndex] = useState(0)
  const [recipient, setRecipient] = useState<Transfer["recipient"]>("regular")
  const [amount, setAmount] = useState("12000")
  const [screen, setScreen] = useState<Screen>("transfer")
  const [answers, setAnswers] = useState<Answers>(unknown)
  const [assessment, setAssessment] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const title = useRef<HTMLHeadingElement>(null)
  const previousScreen = useRef(screen)

  useEffect(() => {
    if (previousScreen.current !== screen) title.current?.focus()
    previousScreen.current = screen
  }, [screen])

  function reset(next: Screen) {
    setAnswers(unknown)
    setAssessment(null)
    setError("")
    setScreen(next)
  }

  function selectScenario(i: number) {
    setIndex(i)
    setRecipient(scenarios[i].recipient)
    setAmount(String(scenarios[i].amount))
    reset("transfer")
  }

  async function assess(event: FormEvent, context: Answers) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/risk/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), recipient, answers: context })
      })
      if (!response.ok) throw new Error("Assessment failed")
      const result: Result = await response.json()
      setAssessment(result)
      const action = result.recommendedAction
      setScreen(action === "STOP_AND_VERIFY_WITH_BANK" ? "warning" : action === "ASK_CONTEXT" ? "context" : "review")
    } catch {
      setError("Не удалось выполнить проверку. Попробуйте ещё раз.")
    } finally {
      setBusy(false)
    }
  }

  const amountText = money.format(Number(amount)) + " ₸"
  const recipientName = recipients[recipient].split(" · ")[0]
  const screenTitle: Record<Screen, string> = {
    transfer: "Новый перевод",
    review: "Подтверждение",
    context: "Уточним детали",
    warning: "Остановите перевод",
    complete: "Перевод завершён",
    cancelled: "Перевод отменён"
  }

  return (
    <main className="workspace">
      <aside className="guide">
        <div className="brand"><span aria-hidden="true">◈</span> TransferGuard</div>
        <h1>Защита в момент перевода</h1>
        <p className="summary">Пройдите сценарий в мобильном интерфейсе. Если операции нужна дополнительная проверка, она появится до подтверждения.</p>
        <nav aria-label="Сценарии демо">
          {scenarios.map((scenario, i) => (
            <button key={scenario.title} type="button" aria-pressed={i === index} disabled={busy} onClick={() => selectScenario(i)}>
              {scenario.title}
            </button>
          ))}
        </nav>
        <p className="scenario" aria-live="polite">{scenarios[index].detail}</p>
      </aside>

      <section className="phone" aria-label="Симулятор мобильного банка">
        <div className="app-bar">
          <strong>Мобильный банк</strong><span>Симуляция</span>
        </div>
        <div className="app-content" data-screen={screen}>
          {screen === "warning" && <span className="status-icon" aria-hidden="true">!</span>}
          {screen === "complete" && <span className="status-icon" aria-hidden="true">✓</span>}
          <h2 ref={title} tabIndex={-1}>{screenTitle[screen]}</h2>

          {screen === "transfer" && (
            <form onSubmit={event => assess(event, unknown)}>
              <fieldset disabled={busy}>
                <label>Получатель
                  <select value={recipient} onChange={event => setRecipient(event.target.value as Transfer["recipient"])}>
                    {Object.entries(recipients).map(([id, name]) => <option value={id} key={id}>{name}</option>)}
                  </select>
                </label>
                <label>Сумма, ₸
                  <input required type="number" inputMode="numeric" min="1" max="10000000" step="1" value={amount} onChange={event => setAmount(event.target.value)} />
                </label>
                <button className="primary">{busy ? "Загрузка…" : "Продолжить"}</button>
              </fieldset>
            </form>
          )}

          {(screen === "review" || screen === "context" || screen === "warning") && (
            <div className="transaction"><span>{recipientName}</span><strong>{amountText}</strong></div>
          )}

          {screen === "context" && (
            <form onSubmit={event => assess(event, answers)}>
              <p>Ответьте на три вопроса, чтобы продолжить перевод.</p>
              <fieldset disabled={busy}>
                {questionKeys.map(key => (
                  <fieldset className="question" key={key}>
                    <legend>{questions[key]}</legend>
                    <div className="choices">{([true, false] as const).map(value => (
                      <label key={String(value)}>
                        <input type="radio" name={key} required checked={answers[key] === value}
                          onChange={() => setAnswers(current => ({ ...current, [key]: value }))} />
                        {value ? "Да" : "Нет"}
                      </label>
                    ))}</div>
                  </fieldset>
                ))}
                <button className="primary">{busy ? "Проверяем…" : "Продолжить"}</button>
                <button type="button" className="secondary" onClick={() => reset("cancelled")}>Отменить перевод</button>
              </fieldset>
            </form>
          )}

          {screen === "review" && (
            <>
              {assessment?.recommendedAction === "REVIEW_DETAILS" && <p>Сверьте имя получателя и сумму с вашей договорённостью.</p>}
              <button className="primary" onClick={() => setScreen("complete")}>Подтвердить перевод</button>
              <button className="secondary" onClick={() => reset("transfer")}>Изменить данные</button>
              <button className="text" onClick={() => setScreen("context")}>Мне дали инструкции по телефону</button>
            </>
          )}

          {screen === "warning" && (
            <>
              <p>Есть признаки мошенничества. Завершите разговор и самостоятельно свяжитесь с банком через официальное приложение.</p>
              <ul>{assessment?.reasons.map(reason => <li key={reason.code}>{reason.text}</li>)}</ul>
              <button className="primary" onClick={() => reset("cancelled")}>Отменить перевод</button>
            </>
          )}

          {(screen === "complete" || screen === "cancelled") && (
            <>
              <p>{screen === "complete" ? "Учебный перевод завершён. Списания не было." : "Операция завершена без перевода."}</p>
              <button className="primary" onClick={() => selectScenario(index)}>Начать заново</button>
            </>
          )}

          {error && <p role="alert" className="error">{error}</p>}
        </div>
      </section>
    </main>
  )
}
