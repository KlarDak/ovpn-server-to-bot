import net from "node:net";

const HOST = "127.0.0.1";
const PORT = 7505;

function sendCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: HOST, port: PORT });

    let buffer = "";

    socket.on("connect", () => {
      socket.write(command + "\n");
      socket.write("quit\n");
    });

    socket.on("data", (data) => {
      buffer += data.toString();
    });

    socket.on("error", reject);

    socket.on("close", () => {
      resolve(buffer);
    });
  });
}

export async function getConnectedClients() {
  const out = await sendCommand("status");
  const lines = out.split(/\r?\n/);

  const clients: Record<string, any> = {};

  let inClientList = false;
  let inRoutingTable = false;

  for (const line of lines) {
    // ===== CLIENT LIST =====
    if (line === "OpenVPN CLIENT LIST") {
      inClientList = true;
      continue;
    }

    if (line === "ROUTING TABLE") {
      inClientList = false;
      inRoutingTable = true;
      continue;
    }

    if (line === "GLOBAL STATS") {
      inRoutingTable = false;
      continue;
    }

    if (inClientList) {
      if (
        !line ||
        line.startsWith("Updated,") ||
        line.startsWith("Common Name")
      )
        continue;

      const cols = line.split(",");

      const uuid = cols[0];
      const realIp = cols[1]?.split(":")[0] ?? null;
      const bytesReceived = Number(cols[2] ?? 0);
      const bytesSent = Number(cols[3] ?? 0);
      const connectedSince = cols[4] ?? null;

      clients[uuid as string] = {
        uuid,
        realIp,
        virtualIp: null,
        connectedSince,
        bytesReceived,
        bytesSent,
      };
    }

    // ===== ROUTING TABLE =====
    if (inRoutingTable) {
      if (!line || line.startsWith("Virtual Address")) continue;

      const cols = line.split(",");
      const virtualIp = cols[0];
      const uuid = cols[1];

      if (clients[uuid as string]) {
        clients[uuid as string].virtualIp = virtualIp;
      }
    }
  }

  return Object.values(clients);
}

export async function kickUser(uuid: string) {
  await sendCommand(`kill ${uuid}`);
}
