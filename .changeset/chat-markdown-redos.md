---
'@youj/react': patch
---

Security: a long chat message with no sentence end can no longer freeze the page in reduced motion. `ChatMarkdown` revealed a streaming answer with a pattern that took seconds on tens of thousands of characters; it now finds the last sentence or line end in one pass, with the same result. The frame sidebar tree also finds the row to focus by comparing ids instead of building a selector, so a page id holding a quote or a backslash no longer throws on arrow keys.
