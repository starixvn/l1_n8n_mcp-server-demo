import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';
import dotenv from 'dotenv';

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
    playerId: z.string().optional(),
    limit: z.number().default(10)
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

// Start the server
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error); 