import { test, expect } from "@playwright/test"
for (const scenario of [
  { name:"Обычный перевод", answer:null, level:"Низкий риск" },
  { name:"Крупная покупка", answer:"false", level:"Повышенный риск" },
  { name:"Звонок из банка", answer:"true", level:"Высокий риск" }
]) test(scenario.name, async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", {name:scenario.name}).click()
  const check = page.getByRole("button", {name:"Проверить перевод"})
  await check.click()
  if (scenario.answer !== null) {
    await expect(page.getByRole("heading", {name:"Обстоятельства перевода"})).toBeVisible()
    for (const label of [/Вас торопят/, /Указания о переводе/, /Вам предложили/])
      await page.getByLabel(label).selectOption(scenario.answer)
    await check.click()
  }
  await expect(page.getByRole("heading", {name:scenario.level})).toBeVisible()
  if (scenario.answer === "false") await expect(page.getByText(/Сверьте реквизиты/)).toBeVisible()
  if (scenario.answer === "true") await expect(page.getByText(/Завершите разговор/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
