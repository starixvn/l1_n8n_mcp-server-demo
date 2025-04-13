import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import axios from 'axios';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';

dotenv.config();

const server = new McpServer({
  name: 'game-logs-server',
  version: '1.0.0',
  description: 'Server for retrieving game logs from Lumigame'
}, {
  capabilities: {
    logging: {}
  }
});

// Define the log types
const LogType = z.enum(['recentLogs', 'signinLogs']);
type LogType = z.infer<typeof LogType>;

// Define the response type
interface LogResponse {
  success: boolean;
  data: any[];
  error?: string;
}

// Register the echo tool
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }]
  })
);

// Helper function to make API requests
async function fetchLogs(type: LogType, playerId?: string, limit: number = 10): Promise<LogResponse> {
  try {
    const baseUrl = 'https://l1-proxy.lumigame.com/admin-logs-api/logs';
    const endpoint = type === 'recentLogs' ? '/top' : '/sign-ins/top';
    
    const params: Record<string, any> = { limit };
    if (playerId) {
      params.playerId = playerId;
    }

    const response = await axios.get(`${baseUrl}${endpoint}`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Register the tool
server.tool(
  'getLogs',
  {
    logType: LogType,
    playerId: z.string(),
    limit: z.number().optional().default(10)
  },
  async (params, _extra) => {
    const { logType, playerId, limit } = params;
    const result = await fetchLogs(logType, playerId, limit);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// Create Express app
const app = express();


// Store active transports
const transports: {[sessionId: string]: SSEServerTransport} = {};

// SSE endpoint
app.get("/sse", async (req: Request, res: Response) => {
  try {
    console.log("--> Received SSE connection request");
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    
    console.log("Transport created with sessionId:", transport.sessionId);
    
    // Single cleanup handler
    res.on("close", () => {
      console.log('SSE connection closed for session:', transport.sessionId);
      delete transports[transport.sessionId];
    });

    // Handle errors
    res.on("error", (error) => {
      console.error('SSE connection error for session:', transport.sessionId, error);
      if (!res.writableEnded) {
        res.end();
      }
    });
    
    // Connect server to transport
    await server.connect(transport);
    console.log("Server connected to transport for session:", transport.sessionId);
  } catch (error) {
    console.error('Error in SSE connection:', error);
    if (!res.writableEnded) {
      res.status(500).end();
    }
  }
});

// Message endpoint
app.post("/messages", async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    console.log("--> Received POST message for session:", sessionId);
    
    const transport = transports[sessionId];
    if (!transport) {
      console.error("No transport found for session:", sessionId);
      res.status(400).send('No transport found for sessionId');
      return;
    }

    console.log("Found transport, handling message...");
    await transport.handlePostMessage(req, res);
    console.log("<-- Message handled for session:", sessionId);
    
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Message endpoint: http://localhost:${PORT}/messages`);
}); 