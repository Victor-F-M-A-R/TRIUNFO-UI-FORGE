export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Enable Chrome Built‑in AI</h1>
        <a href="/" className="text-sm text-sky-300 hover:underline">
          Back to app
        </a>
      </div>
      <ol className="space-y-4 text-sm">
        <li>
          1) Use Chrome Canary atualizado (perfil LIMPO). Inicie sem extensões.
        </li>
        <li>
          2) Em chrome://flags, habilite e reinicie o browser:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              Prompt API for Gemini Nano (se houver “Enabled Multilingual”, pode
              usar)
            </li>
            <li>Prompt API for Gemini Nano with Multimodal Input</li>
            <li>Summarization API for Gemini Nano (opcional, texto)</li>
            <li>Writer API for Gemini Nano (opcional, texto)</li>
            <li>Rewriter API for Gemini Nano (opcional, texto)</li>
            <li>Proofreader API for Gemini Nano (opcional, texto)</li>
          </ul>
        </li>
        <li>
          3) Volte ao app e clique “Check again”. Deve mostrar “On‑device”
          (Prompt API) ou “Text‑only” (APIs de texto).
        </li>
        <li>
          4) Se ainda aparecer “Unavailable”, abra o app com um perfil limpo e
          forçando as features pela linha de comando (Windows):
          <pre className="bg-slate-950 p-3 rounded overflow-auto">
            C:\Users\%USERNAME%\AppData\Local\Google\Chrome
            SxS\Application\chrome.exe ^ --user-data-dir="%TEMP%\canary-clean" ^
            --disable-extensions --no-first-run ^
            --enable-features=PromptAPIForGeminiNano,PromptAPIForGeminiNanoWithMultimodalInput,WriterAPIForGeminiNano,RewriterAPIForGeminiNano,ProofreaderAPIForGeminiNano,SummarizationAPIForGeminiNano
          </pre>
        </li>
      </ol>
      <p className="text-xs text-slate-400 mt-6">
        Dica: Localhost é “secure context”, ok. Alguns builds/países podem não
        expor window.ai mesmo com flags. Nesse caso, use Text‑only/Hybrid para
        demo.
      </p>
    </main>
  );
}
