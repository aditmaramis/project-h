---
applyTo: '**'
---

# UI Components — shadcn/ui Only

All UI elements in Hibah **must** use [shadcn/ui](https://ui.shadcn.com/) components. Never create custom UI components from scratch.

---

## Rules

- **Use shadcn/ui for every UI element** — buttons, dialogs, inputs, cards, dropdowns, tables, forms, toasts, etc.
- **Never build custom components** that replicate what shadcn/ui provides (e.g., custom modals, custom dropdowns, custom tooltips).
- **Install missing components** via the CLI before using them:
  ```bash
  npx shadcn@latest add <component-name>
  ```
- Components are installed to `components/ui/` and can be customized in-place after installation.
- The project uses the **base-nova** style (see `components.json`).

## Composition, Not Creation

When you need a specialized piece of UI:

1. **Check if shadcn/ui has it** — browse the [component list](https://ui.shadcn.com/docs/components).
2. **Compose existing primitives** — combine `Card`, `Button`, `Badge`, etc. rather than writing raw HTML/Tailwind.
3. **Extend via props/variants** — add CVA variants to installed shadcn components if needed.

```tsx
// CORRECT — compose shadcn primitives
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function ItemCard({ item }: { item: Item }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{item.title}</CardTitle>
			</CardHeader>
			<CardContent>
				<Badge variant="secondary">{item.condition}</Badge>
			</CardContent>
		</Card>
	);
}
```

```tsx
// WRONG — custom component that shadcn already provides
function CustomModal({ children }: { children: React.ReactNode }) {
	return <div className="fixed inset-0 z-50 bg-black/50">...</div>;
}
```

## Imports

Always import from the `@/components/ui/` path:

```ts
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
```

## Icons

Use **Lucide React** for icons (configured in `components.json`):

```ts
import { Search, Plus, Trash2 } from 'lucide-react';
```

## What Counts as "UI"

This rule applies to all visual/interactive elements: navigation, forms, modals, popovers, tooltips, selects, switches, tabs, accordions, alerts, avatars, skeletons, separators, etc.

**Exceptions** (not shadcn territory):

- Map components (Leaflet — `components/map/`)
- Layout shells (`components/layout/`) — header/footer structure
- Page-level composition components that purely compose shadcn primitives
