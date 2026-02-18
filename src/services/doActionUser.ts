import net from "node:net";

/**
 * This module provides functions to interact with the OpenVPN management interface, allowing you to retrieve information about connected clients and kick users based on their UUID. The sendCommand function establishes a TCP connection to the management interface, sends a command, and returns the response as a string. The getConnectedClients function retrieves the list of currently connected clients and their details, while the kickUser function allows you to disconnect a user by sending a kill command with their UUID.
 */
const HOST = "127.0.0.1";
const PORT = 7505;

/**
 * Send a command to the OpenVPN management interface and return the response as a string. The function establishes a TCP connection to the management interface using the specified host and port, sends the command followed by a newline character, and listens for data events to accumulate the response. Once the connection is closed, it resolves the promise with the accumulated response string. If an error occurs during the connection or communication, it rejects the promise with the error.
 * @param command - string representing the command to be sent to the OpenVPN management interface, which should be a valid command recognized by the interface
 * @returns Promise<string> - a promise that resolves with the response from the OpenVPN management interface as a string if the command is successfully sent and a response is received, or rejects with an error if any issues occur during the connection or communication process
 */
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

/**
 * Retrieve the list of currently connected clients from the OpenVPN management interface, along with their details such as UUID, real IP, virtual IP, connection time and data usage. The function sends a status command to the management interface using the sendCommand function, parses the response to extract client information, and returns an array of client objects containing the relevant details. If any issues occur during the communication with the management interface or parsing of the response, it may throw an error or return an empty array.
 * @returns Promise<Record<string, any>[]> - a promise that resolves with an array of client objects containing details of currently connected clients if the retrieval is successful, or may throw an error if any issues occur during communication or parsing
 */
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

/**
 * Disconnect a user from the OpenVPN server by sending a kill command with their UUID to the management interface. The function takes a UUID as an argument, constructs the appropriate command to disconnect the user, and sends it using the sendCommand function. If the command is successfully sent and the user is disconnected, it resolves without returning any value. If any issues occur during communication with the management interface or if the UUID is invalid, it may throw an error.
 * @param uuid - string representing the UUID of the user to be disconnected, which should correspond to a valid UUID of a currently connected client in the OpenVPN server
 * @returns Promise<void> - a promise that resolves without returning any value if the user is successfully disconnected, or may throw an error if any issues occur during communication or if the UUID is invalid
 */
export async function kickUser(uuid: string): Promise<void> {
  await sendCommand(`kill ${uuid}`);
}
