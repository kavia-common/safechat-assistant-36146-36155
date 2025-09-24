# Safe Prompt Frontend (Angular)

Angular 19 standalone application implementing an Ocean Professional themed chat UI with:
- Responsive layout
- Sidebar chat history
- Central conversation panel
- Input with enter-to-send
- Moderation feedback badges
- Backend API integration

## Development

Start dev server:
```bash
npm install
npm start
```
Open http://localhost:3000

## API configuration

By default, the frontend calls the backend at `/api`. You can override at runtime by setting a global before the app loads:
```html
<script>
  window.__APP_API_BASE_URL__ = 'https://your-backend.example.com';
</script>
```

Endpoints expected:
- POST /chat/send
  - Body: { conversationId?: string, content: string }
  - Returns (supported shapes):
    - Minimal: { "chat": string, "moderation": boolean }
    - Or: { conversationId: string, messages: ChatMessage[], moderation?: ModerationInfo }
- GET /chat/history (optional)
  - Returns: ChatSummary[]
- GET /chat/conversation/:id (optional)
  - Returns: Conversation

## Theming

Ocean Professional theme uses blue and amber accents with subtle gradients, shadows, and rounded corners. Global styles are set in `src/styles.css` and components include scoped styles.

## Notes

- SSR bootstrap signature complies with Angular 19 SSR expectations.
- All `@angular/*` package versions are aligned to avoid build issues.
