import { notFoundRecoveryLinks } from "@/lib/not-found-recovery"

export function NotFoundDocument() {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f8f7ef",
          color: "#1e2219",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}
      >
        <main
          style={{
            margin: "0 auto",
            maxWidth: "48rem",
            padding: "5rem 1.5rem",
          }}
        >
          <p style={{ color: "#087a55", fontWeight: 600 }}>404 · OpenSyria</p>
          <h1>Page not found</h1>
          <p>
            The requested OpenSyria resource does not exist. Continue with one
            of these public indexes:
          </p>
          <ul>
            {notFoundRecoveryLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  )
}
