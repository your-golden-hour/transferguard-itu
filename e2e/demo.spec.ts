import { test, expect } from "@playwright/test"

for (const scenario of [
  { name: "Обычный перевод", answer: null },
  { name: "Крупная покупка", answer: "Нет" },
  { name: "Звонок из банка", answer: "Да" }
]) {
  test(scenario.name, async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: scenario.name }).click()
    const bank = page.getByRole("region", { name: "Симулятор мобильного банка" })
    const next = bank.getByRole("button", { name: "Продолжить" })
    const confirm = bank.getByRole("button", { name: "Подтвердить перевод" })

    await next.click()
    if (scenario.answer) {
      await expect(bank.getByRole("heading", { name: "Уточним детали" })).toBeVisible()
      await expect(confirm).toHaveCount(0)
      for (const question of [/Вас торопят/, /Указания о переводе/, /Вам предложили/]) {
        await bank.getByRole("group", { name: question }).getByRole("radio", { name: scenario.answer, exact: true }).check()
      }
      await next.click()
    }

    if (scenario.answer === "Да") {
      await expect(bank.getByRole("heading", { name: "Остановите перевод" })).toBeVisible()
      await expect(bank.getByText(/Завершите разговор/)).toBeVisible()
      await expect(confirm).toHaveCount(0)
      await bank.getByRole("button", { name: "Отменить перевод" }).click()
      await expect(bank.getByRole("heading", { name: "Перевод отменён" })).toBeVisible()
    } else {
      await expect(bank.getByRole("heading", { name: "Подтверждение" })).toBeVisible()
      if (scenario.answer === "Нет") await expect(bank.getByText(/Сверьте имя/)).toBeVisible()
      await confirm.click()
      await expect(bank.getByRole("heading", { name: "Перевод завершён" })).toBeVisible()
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
