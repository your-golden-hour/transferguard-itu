import type { ReactNode } from "react"
import "./style.css"
export const metadata = { title: "TransferGuard · Проверка перевода", description: "Симулятор контекстной проверки банковского перевода" }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>
}
