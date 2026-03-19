import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"
import pino from "pino"

console.log("🚀 Bot iniciando...")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" })
  })

  if (!sock.authState.creds.registered) {
    const numero = "SEU_NUMERO_AQUI"
    const code = await sock.requestPairingCode(numero)
    console.log("📲 Código:", code)
  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    const from = msg.key.remoteJid

    if (texto === "$menu") {
      await sock.sendMessage(from, {
        text: "📜 MENU\n\n$menu\n$ping"
      })
    }

    if (texto === "$ping") {
      await sock.sendMessage(from, {
        text: "🏓 Pong!"
      })
    }
  })
}

startBot()
