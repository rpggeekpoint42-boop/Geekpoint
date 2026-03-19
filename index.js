import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import pino from "pino"

console.log("🚀 Iniciando bot...")

let sock

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "20.0.04"] // evita alguns bloqueios
  })

  // 💾 salvar sessão
  sock.ev.on("creds.update", saveCreds)

  // 🔥 conexão
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting") {
      console.log("🔄 Conectando...")
    }

    if (connection === "open") {
      console.log("✅ Bot conectado!")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Sessão expirada, apague a pasta auth.")
      } else {
        console.log("♻️ Reconectando...")
        setTimeout(() => startBot(), 3000) // evita loop rápido
      }
    }

    // 📲 pairing code (corrigido pra não spammar)
    if (!sock.authState.creds.registered) {
      try {
        const numero = "559XXXXXXXXX" // ⚠️ seu número
        const code = await sock.requestPairingCode(numero)
        console.log("📲 Código:", code)
      } catch (err) {
        console.log("❌ Erro no pairing:", err?.message)
      }
    }
  })

  // 🤖 mensagens
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg.message) return

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text

      const from = msg.key.remoteJid

      if (!texto) return

      console.log("📩", texto)

      // menu
      if (texto === "$menu") {
        await sock.sendMessage(from, {
          text: "📜 MENU\n\n$menu\n$ping"
        })
      }

      // ping
      if (texto === "$ping") {
        await sock.sendMessage(from, {
          text: "🏓 Pong!"
        })
      }

    } catch (err) {
      console.log("❌ Erro mensagem:", err.message)
    }
  })
}

// 🚀 iniciar
startBot()
