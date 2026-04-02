"@whiskeysockets/baileys": "latest"
import pino from 'pino'

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = pkg

let jaGerouCodigo = false

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['GeekPoint Bot', 'Chrome', '1.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 GERA CÓDIGO NO MOMENTO CERTO (CORRIGE 405/428)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'connecting') {
            if (!jaGerouCodigo) {
                try {
                    jaGerouCodigo = true
                    const numero = "559180305171"
                    const code = await sock.requestPairingCode(numero)
                    console.log("🔗 Código de pareamento:", code)
                } catch (e) {
                    console.log("Erro ao gerar código:", e)
                }
            }
        }

        if (connection === 'open') {
            console.log("✅ GeekPoint Bot conectado!")
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            console.log("❌ Conexão fechada:", statusCode)

            if (statusCode !== DisconnectReason.loggedOut) {
                setTimeout(() => {
                    startBot()
                }, 5000)
            } else {
                console.log("🚫 Deslogado, precisa parear de novo")
            }
        }
    })

    // 📩 comando ping
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0]
            if (!msg.message) return

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text

            if (text === 'ping') {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🏓 Pong!\n🤖 GeekPoint Bot online!'
                })
            }
        } catch {}
    })
}

startBot()
