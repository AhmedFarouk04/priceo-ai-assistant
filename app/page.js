export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Priceo AI Assistant</h1>
      <p>API is running successfully.</p>

      <h3>Available Endpoints</h3>
      <ul>
        <li>/api/health</li>
        <li>/api/chat</li>
      </ul>
    </main>
  );
}
