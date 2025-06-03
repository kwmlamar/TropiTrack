import { createContext, useContext } from "react"

type QuickActionHandler = (action: string) => void

const QuickActionContext = createContext<QuickActionHandler | null>(null)

export const useQuickAction = () => useContext(QuickActionContext)

export const QuickActionProvider = ({
  children,
  onAction,
}: {
  children: React.ReactNode
  onAction: QuickActionHandler
}) => (
  <QuickActionContext.Provider value={onAction}>
    {children}
  </QuickActionContext.Provider>
)
