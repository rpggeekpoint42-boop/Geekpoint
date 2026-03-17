import makeWASocket, { 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  DisconnectReason 
} from "@whiskeysockets/baileys"
import pino from "pino"
import fs from "fs"

console.log("🚀 Iniciando GeekPoint...")

const prefix = "$"
let commandCount = 0

const nickDataFile = "./nicks.json"

function loadNickData(){
  if(!fs.existsSync(nickDataFile)) return {}
  return JSON.parse(fs.readFileSync(nickDataFile))
}

function saveNickData(data){
  fs.writeFileSync(nickDataFile, JSON.stringify(data,null,2))
}

async function startBot(){

  const { state, saveCreds } = await useMultiFileAuthState("GeekPointSession")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["GeekPoint","Chrome","1.0.0"]
  })

  // 🔑 CÓDIGO DE PAREAMENTO
  if (!sock.authState.creds.registered) {
    const numero = "SEU_NUMERO_AQUI" // EX: 5599999999999

    const code = await sock.requestPairingCode(numero)
    console.log("🔑 Código de pareamento:", code)
  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({connection,lastDisconnect})=>{

    if(connection === "connecting"){
      console.log("🌐 Conectando ao WhatsApp...")
    }

    if(connection === "open"){
      console.log("✅ Bot conectado!")
    }

    if(connection === "close"){
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Conexão fechada")

      if(shouldReconnect) startBot()
    }

  })

  sock.ev.on("messages.upsert", async ({messages})=>{

    const msg = messages[0]
    if(!msg.message) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if(!text) return

    const chatId = msg.key.remoteJid
    const senderJid = msg.key.participant || msg.key.remoteJid

    const nickData = loadNickData()

/* ===================== */
/* PING */
/* ===================== */

if(text.startsWith(`${prefix}ping`)){

  commandCount++

  const start = Date.now()

  const sent = await sock.sendMessage(chatId,{
    text:"🏓 Calculando ping..."
  })

  const latency = Date.now() - start

  await sock.sendMessage(chatId,{
    edit: sent.key,
    text:`🏓 Pong!\n⚡ ${latency} ms`
  })

  return
}

/* ===================== */
/* STATUS */
/* ===================== */

if(text.startsWith(`${prefix}status`)){

commandCount++

const uptime = process.uptime()

const hours = Math.floor(uptime / 3600)
const minutes = Math.floor((uptime % 3600) / 60)
const seconds = Math.floor(uptime % 60)

const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)

const allGroups = await sock.groupFetchAllParticipating()
const groups = Object.keys(allGroups).length

const resposta = `
🤖 *GeekPoint Bot Status*

🧠 Memória: ${memory} MB
⏳ Online: ${hours}h ${minutes}m ${seconds}s

👥 Grupos: ${groups}
📜 Comandos usados: ${commandCount}
`

await sock.sendMessage(chatId,{text:resposta})

return
}

/* ===================== */
/* QUEST RPG */
/* ===================== */

if(text === `${prefix}Quest`){

commandCount++

const perguntas = [
"Qual a diferença entre Ataques e Golpes ?",
"Qual habilidade pode matar o adversário de uma só vez ?",
"Entre paralisia com dano e paralisia sem dano, qual vence ?",
"Qual o melhor card para responder contra card de falha ?"
]

const desafios = [
"Vá no PV de um Administrador e faça uma pergunta.",
"Vá até o PV de um Fundador e faça um elogio.",
"Vá no Chat Global e deseje bom dia / boa tarde / boa noite.",
"Desafie seu Chefe de Raça para um duelo."
]

const recompensas = [
"100 Ouros 🪙",
"200 Ouros 🪙",
"300 Ouros 🪙",
"500 Ouros 🪙"
]

const chance = Math.random()

let tipo

if(chance < 0.425) tipo = "pergunta"
else if(chance < 0.85) tipo = "desafio"
else tipo = "recompensa"

let resposta = "📜 *QUEST RPG*\n\n"

if(tipo === "pergunta"){
const pergunta = perguntas[Math.floor(Math.random()*perguntas.length)]
resposta += `❓ *Pergunta*\n\n${pergunta}`
}
else if(tipo === "desafio"){
const desafio = desafios[Math.floor(Math.random()*desafios.length)]
resposta += `⚔ *Desafio*\n\n${desafio}`
}
else{
const premio = recompensas[Math.floor(Math.random()*recompensas.length)]
resposta += `🎁 *Recompensa*\n\nVocê ganhou:\n${premio}`
}

await sock.sendMessage(chatId,{text:resposta})

return
}

  })

}

startBot()
