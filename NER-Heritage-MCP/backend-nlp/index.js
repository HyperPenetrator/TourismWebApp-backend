import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import nlp from "compromise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateTextInput, scrubPII } from "../backend-safety/validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERITAGE_DATA_PATH = path.join(__dirname, "../data-stores/heritage_sites.json");

// Load heritage data
let heritageSites = [];
try {
  const rawData = fs.readFileSync(HERITAGE_DATA_PATH, "utf8");
  heritageSites = JSON.parse(rawData);
} catch (error) {
  console.error("Warning: Could not load heritage_sites.json", error.message);
}

const server = new Server(
  {
    name: "ner-heritage-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool for extracting heritage-related entities from text.
 */
const EXTRACT_HERITAGE_ENTITIES_TOOL = {
  name: "extract_heritage_entities",
  description: "Extract heritage sites, people, and events from a given text and match against known sites.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text to analyze.",
      },
    },
    required: ["text"],
  },
};

/**
 * Tool for requesting a custom commission from an artisan.
 */
const REQUEST_ARTISAN_COMMISSION_TOOL = {
  name: "request_artisan_commission",
  description: "Draft and submit a formal commission request to a verified master artisan.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the commission (e.g., 'Custom Muga Silk Saree with Geometric Patterns').",
      },
      description: {
        type: "string",
        description: "Detailed description of the craft, dimensions, and specific cultural motifs requested.",
      },
      budget: {
        type: "string",
        description: "Expected budget range in INR (e.g., '15,000 - 20,000').",
      },
      artisan_id: {
        type: "string",
        description: "The ID of the verified artisan.",
      },
    },
    required: ["title", "description", "artisan_id"],
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [EXTRACT_HERITAGE_ENTITIES_TOOL, REQUEST_ARTISAN_COMMISSION_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "extract_heritage_entities") {
    let text = request.params.arguments?.text;
    if (!text) {
      throw new Error("Text is required");
    }

    // Safety validation
    const validation = validateTextInput(text);
    if (!validation.valid) {
      return {
        content: [
          {
            type: "text",
            text: `Safety Error: ${validation.error}`,
          },
        ],
        isError: true,
      };
    }

    // PII Scrubbing
    text = scrubPII(text);

    const doc = nlp(text);
    const people = doc.people().out("array");
    const places = doc.places().out("array");
    const dates = doc.match('#Date').out("array");

    // Match identified places against heritage sites
    const matchedSites = heritageSites.filter(site => 
      places.some(p => p.toLowerCase().includes(site.name.toLowerCase()) || 
                      site.name.toLowerCase().includes(p.toLowerCase()))
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            entities: {
              people,
              places,
              dates,
            },
            matchedHeritageSites: matchedSites,
            summary: `Found ${people.length} people, ${places.length} places, and matched ${matchedSites.length} heritage sites.`,
          }, null, 2),
        },
      ],
    };
  }

  if (request.params.name === "request_artisan_commission") {
    const { title, description, budget, artisan_id } = request.params.arguments || {};
    
    if (!title || !description || !artisan_id) {
      throw new Error("Title, description, and artisan_id are required.");
    }

    // Safety validation on description
    const validation = validateTextInput(description);
    if (!validation.valid) {
      return {
        content: [{ type: "text", text: `Safety Error: ${validation.error}` }],
        isError: true,
      };
    }

    const commissionId = `COM-${Math.floor(Math.random() * 10000)}`;
    
    return {
      content: [
        {
          type: "text",
          text: `Commission request drafted successfully!\n\nID: ${commissionId}\nArtisan ID: ${artisan_id}\nTitle: ${title}\nBudget: ${budget || "Negotiable"}\n\nStatus: Pending verification. You can view this in the 'Artisan Direct' chat channel.`,
        },
      ],
      structuredContent: {
        commissionId,
        status: "pending",
        artisanId: artisan_id,
        summary: title
      }
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NER Heritage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
