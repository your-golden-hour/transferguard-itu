import { z } from "zod"
import { evaluate } from "../../../../lib/risk.ts"

const answer = z.boolean().nullable()
const schema = z.strictObject({
  recipient: z.enum(["regular", "new"]),
  amount: z.number().int().min(1).max(10000000),
  answers: z.strictObject({ pressure: answer, caller: answer, safe: answer })
})
const error = (message: string, status: number) => Response.json({ error: message }, { status })
export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return error("Ожидается JSON.", 415)
  const reader = request.body?.getReader()
  if (!reader) return error("Пустой запрос.", 400)
  const bytes = new Uint8Array(2048)
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (size + value.length > bytes.length) {
        await reader.cancel()
        return error("Запрос слишком велик.", 413)
      }
      bytes.set(value, size)
      size += value.length
    }
    const data = schema.safeParse(JSON.parse(new TextDecoder().decode(bytes.subarray(0, size))))
    if (!data.success) return error("Проверьте получателя, сумму и ответы.", 400)
    return Response.json(evaluate(data.data))
  } catch {
    return error("Не удалось прочитать запрос.", 400)
  } finally {
    reader.releaseLock()
  }
}
