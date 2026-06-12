import { StoreProvider } from "./state/store";
import { AppShell } from "./views/AppShell";

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
