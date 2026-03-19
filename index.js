import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import pino from "pino"
import fs from "fs"

console.log("🚀 Iniciando bot...")

// 🧹 LIMPAR SESSÃO BUGADA (RODA SÓ 1 VEZ)
if (fs.existsSync("./auth")) {
  fs.rmSync("./auth", { recursive: true, force: true })
  console.log("🧹 Sessão antiga apagada!")
}

let sock
let codigoGerado = false

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: ["Windows", "Chrome", "120.0.0"]
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
      console.log("✅ Conectado com sucesso!")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Sessão inválida, limpe auth e reconecte.")
      } else {
        console.log("♻️ Reconectando em 5s...")
        setTimeout(() => startBot(), 5000)
      }
    }

    // 📲 GERAR CÓDIGO (SEM BUG)
    if (!sock.authState.creds.registered && !codigoGerado) {
      codigoGerado = true
      try {
        const numero = "559180305171" // ⚠️ COLOCA SEU NÚMERO
        const code = await sock.requestPairingCode(numero)
        console.log("📲 Código de pareamento:", code)
      } catch (err) {
        console.log("❌ Erro ao gerar código:", err.message)
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

    } catch (err) {
      console.log("❌ Erro mensagem:", err.message)
    }
  })
}

// 🚀 iniciar
startBot()
