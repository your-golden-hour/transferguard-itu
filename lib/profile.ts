export const recipients = { regular: "Айжан · из истории", new: "Данияр · новый получатель" } as const
export const typicalAmount = 20000
export const questions = {
  pressure: "Вас торопят или просят сохранить перевод в тайне?",
  caller: "Указания о переводе дал человек, представившийся сотрудником банка?",
  safe: "Вам предложили перевести деньги на «безопасный счёт»?"
} as const
export type Answers = Record<keyof typeof questions, boolean | null>
export const unknown: Answers = { pressure: null, caller: null, safe: null }
export type Transfer = { recipient: keyof typeof recipients, amount: number, answers: Answers }
export const scenarios = [
  { title: "Обычный перевод", detail: "Вы возвращаете Айжан 12 000 ₸ за покупки. Ей уже переводили деньги.", recipient: "regular", amount: 12000 },
  { title: "Крупная покупка", detail: "Вы сами выбрали велосипед за 90 000 ₸. Продавцу переводите впервые. Никто не давал указаний.", recipient: "new", amount: 90000 },
  { title: "Звонок из банка", detail: "Звонящий представился сотрудником банка. Он торопит и просит перевести 90 000 ₸ на «безопасный счёт».", recipient: "new", amount: 90000 }
] as const
