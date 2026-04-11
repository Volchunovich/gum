## Security basics

- Never hardcode API keys, passwords, tokens, or secrets — use environment variables
- Use parameterized queries for all database operations — never string concatenation
- Validate and sanitize all user input at system boundaries
- Do NOT log sensitive data (passwords, tokens, personal information)
- Do NOT commit .env files, credentials, or private keys
