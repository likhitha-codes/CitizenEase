/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini SDK with custom telemetry headers
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("⚠️ WARNING: GEMINI_API_KEY environment variable is not set. Document simplification will serve simulated responses or show errors.");
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure Database file exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    console.warn("Vercel Serverless advisory: Write block on read-only root directory. Operation bypassed.");
  }
}
if (!fs.existsSync(DB_FILE)) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], history: [], shares: [] }, null, 2));
  } catch (err) {
    console.warn("Vercel Serverless advisory: Writing fallback db.json bypassed.");
  }
}

// Simple Helper to read/write JSON Database with transactions
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Db read failed, returning default container state: ", err);
  }
  return { users: [], history: [], shares: [] };
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn("Failed to write to local DB (expected if serverless or read-only):", err);
  }
}

// Create Express instance
export const app = express();

// Set response limits to support PDF/Image base64 payloads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid credentials' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const db = readDB();
  const user = db.users.find((u: any) => u.token === token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }
  (req as any).user = user;
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Missing required registration fields' });
    return;
  }

  const db = readDB();
  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  const token = `token_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  const newUser = {
    id: `user_${Math.random().toString(36).substring(2, 9)}`,
    email: email.toLowerCase(),
    password, 
    fullName,
    token,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName },
    token,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Refresh token
  const token = `token_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  user.token = token;
  writeDB(db);

  res.json({
    user: { id: user.id, email: user.email, fullName: user.fullName },
    token,
  });
});

app.get('/api/auth/me', requireAuth, (req: any, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, fullName: req.user.fullName },
  });
});

// 2. Document Processing & Simplification Endpoint
app.post('/api/process', async (req, res) => {
  const { text, fileBase64, mimeType, title = 'Document' } = req.body;

  if (!text && !fileBase64) {
    res.status(400).json({ error: 'Please provide either a paste content or a file upload.' });
    return;
  }

  if (!ai) {
    res.status(503).json({
      error: 'Gemini API not configured. Please add your GEMINI_API_KEY in the AI Studio Secrets panel.'
    });
    return;
  }

  try {
    let documentTitle = title;
    let promptText = "";

    // Construct content parts for general documents
    let contents: any[] = [];

    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      });
      promptText = "Analyze the attached government document. First, extract its raw text if readable and then perform the following instructions:";
    } else {
      contents.push({
        text: `Here is the document text:\n"${text}"`
      });
      promptText = "Analyze the provided government document text and perform the following instructions:";
    }

    // Append specific simplification and translation prompt
    contents.push({
      text: `${promptText}
      
1. VALIDATE RELEVANCE & NIC ADVISORY: Check if the uploaded document or text is government-related using official National Informatics Centre (NIC) verification standards. A document is verified as official or government-related based on NIC indicators of trust:
   a) Official Letterhead/Header: Mention of central, state, union territory, municipal, PSU, or judicial department or ministry (e.g. MeitY, Ministry of Finance, Municipal Corporation etc.).
   b) Official Reference Numbers: Presence of typical reference/file numbers, gazette identifiers, office memoranda (O.M.), circular, or notification codes (e.g., F.No., G.S.R., O.M., Letter No).
   c) Official Digital Anchors: Mention of websites or emails ending with official '.gov.in' or '.nic.in' domains.
   d) Official Sign-off/Designation: Signed or issued by an official authority level position (e.g., Secretary, Deputy Secretary, Director, Commissioner, Under Secretary, Officer on Special Duty).
   Determine relevancePassed based on these rules. Set relevancePassed to true if the document is official or relates to central/state public affairs, policies, laws, municipal warnings, welfare services, or government tenders. Set relevancePassed to false if it has no government relation (e.g. personal chats, commercial ads, general code).
2. CATEGORY DETECTION: Identify which official category this belongs to (e.g. "Welfare Scheme", "Tax Circular", "Public Policy Document", "Legal Notification", "Civic Advisory").
3. DOCUMENT TITLE: Synthesize a highly accurate, clean, citizen-friendly title for this document.
4. SIMPLIFY IN ENGLISH: Rewrite the entire document in extremely clear, citizen-friendly, professional English. Make it highly accessible (at an 8th-grade reading level). You MUST strictly preserve all vital dates, limits, eligibility thresholds, allowances, contact details, benefits, or official deadlines, but eliminate any dense legalese, confusing phrasing, or governmental administrative jargon. Use clean structural lists and bold names.
5. TELUGU TRANSLATION & SIMPLIFICATION (PLAIN-LANGUAGE PERSONA): Translate the simplified English version into highly accessible, clear, colloquial, everyday Telugu. Strictly avoid literal, formal, or high-level academic translations of complex English terms or dry administrative vocabulary ("ప్రభుత్వ పరిభాష"). Instead, use simplified phrasing, active voice, and local conversational words that an ordinary Telugu-speaking citizen or village family can instantly comprehend. HOWEVER, you must strictly and with absolute accuracy preserve all numbers, currency values (e.g., Rupees, percentages), eligibility limits, email addresses, phone numbers, and technical thresholds from the original document unaltered.
6. HINDI TRANSLATION & SIMPLIFICATION (PLAIN-LANGUAGE PERSONA): Translate the simplified English version into clean, natural, everyday colloquial Devanagari Hindi (using simple vocabulary instead of heavy, highly Sanskritized, or overly formal administrative terms like "राजभाषा/शासकीय शब्दावली"). Write as if speaking directly to an ordinary citizen, translating ideas into the simplest readable Hindi words. HOWEVER, you must with absolute, non-negotiable precision preserve all dates, cost figures, monetary allowances (Rupees/INR), age limits, percentage rates, and technical criteria from the original English text unaltered.

NOTE FOR FAILED RELEVANCE: Even if relevancePassed is false, you must still fill out all JSON properties using friendly fallbacks or placeholder messages rather than leaving them empty, so that the JSON structure fits the required schema perfectly.

IMPORTANT: Your response must be returned STRICTLY as a valid JSON object matching the defined response Schema type. Keep the formatting completely correct with no trailing commas.`
    });

    // Execute structured schema generation
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevancePassed: {
              type: Type.BOOLEAN,
              description: 'Whether the document belongs to an official government or municipal source or pertains to public/state affairs based on NIC Advisory verification.'
            },
            relevanceExplanation: {
              type: Type.STRING,
              description: 'Short explanation of why this document was identified as government-relevant or why it failed validation according to NIC Advisory criteria.'
            },
            category: {
              type: Type.STRING,
              description: 'The classified category of the government document, such as Land Record, Pension Scheme, Civic Notice.'
            },
            detectedTitle: {
              type: Type.STRING,
              description: 'Polished or extracted title of the official document.'
            },
            simplifiedEnglish: {
              type: Type.STRING,
              description: 'Fully simplified, plain-English version. Clean markdown headings and bold lists are encouraged.'
            },
            teluguTranslation: {
              type: Type.STRING,
              description: 'Authentic translation of the simplified text in modern clear Telugu script.'
            },
            hindiTranslation: {
              type: Type.STRING,
              description: 'Authentic translation of the simplified text in readable standard Hindi Devanagari script.'
            },
            nicAdvisoryCheck: {
              type: Type.OBJECT,
              description: 'NIC Advisory validation matrix parameters checking key government indicators.',
              properties: {
                hasOfficialHeader: {
                  type: Type.BOOLEAN,
                  description: 'True if official central/state/municipal or department heading is present.'
                },
                hasReferenceNumber: {
                  type: Type.BOOLEAN,
                  description: 'True if circular, gazette, F.No, or O.M. reference code is found.'
                },
                hasGovDomainOrEmail: {
                  type: Type.BOOLEAN,
                  description: 'True if .gov.in/.nic.in email or domain suffix is mentioned.'
                },
                hasOfficialDesignation: {
                  type: Type.BOOLEAN,
                  description: 'True if a verification sign-off rank (e.g. Secretary, Commissioner) is found.'
                },
                governmentBodyName: {
                  type: Type.STRING,
                  description: 'The detected official government body (department/ministry/PSU) name, or "Not Available".'
                },
                confidenceScore: {
                  type: Type.INTEGER,
                  description: 'Percentage (0-100) indicating the likelihood of official government origin based on NIC indicators.'
                }
              },
              required: [
                'hasOfficialHeader',
                'hasReferenceNumber',
                'hasGovDomainOrEmail',
                'hasOfficialDesignation',
                'governmentBodyName',
                'confidenceScore'
              ]
            }
          },
          required: [
            'relevancePassed',
            'relevanceExplanation',
            'category',
            'detectedTitle',
            'simplifiedEnglish',
            'teluguTranslation',
            'hindiTranslation',
            'nicAdvisoryCheck'
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from the AI model.");
    }

    const resultJSON = JSON.parse(response.text.trim());

    // Auto-history logs on local session structure
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const db = readDB();
      const user = db.users.find((u: any) => u.token === token);
      if (user) {
        const docId = `doc_${Math.random().toString(36).substring(2, 9)}`;
        const historyItem = {
          id: docId,
          title: resultJSON.detectedTitle || documentTitle,
          timestamp: new Date().toISOString(),
          category: resultJSON.category,
          languageSelected: ['English', 'Telugu', 'Hindi'],
          result: {
            id: docId,
            title: resultJSON.detectedTitle || documentTitle,
            originalText: text || `[Uploaded Document: ${documentTitle}]`,
            category: resultJSON.category,
            relevancePassed: resultJSON.relevancePassed,
            relevanceExplanation: resultJSON.relevanceExplanation,
            simplifiedEnglish: resultJSON.simplifiedEnglish,
            teluguTranslation: resultJSON.teluguTranslation,
            hindiTranslation: resultJSON.hindiTranslation,
            timestamp: new Date().toISOString()
          },
          userId: user.id
        };
        db.history.unshift(historyItem);
        writeDB(db);
      }
    }

    res.json(resultJSON);
  } catch (error: any) {
    console.error('Error in document processing:', error);
    res.status(500).json({ error: error.message || 'An error occurred during AI processing.' });
  }
});

// 3. Share Event Endpoints
app.post('/api/share', (req, res) => {
  const { title, originalText, category, simplifiedEnglish, teluguTranslation, hindiTranslation } = req.body;
  if (!simplifiedEnglish) {
    res.status(400).json({ error: 'Cannot share an empty result' });
    return;
  }

  const shareId = `share_${Math.random().toString(36).substring(2, 9)}`;
  const db = readDB();

  const newShare = {
    id: shareId,
    title: title || 'Simplified Document',
    originalText: originalText || '',
    category: category || 'General',
    simplifiedEnglish,
    teluguTranslation,
    hindiTranslation,
    createdAt: new Date().toISOString()
  };

  db.shares.push(newShare);
  writeDB(db);

  res.json({ shareId });
});

app.get('/api/share/:id', (req, res) => {
  const db = readDB();
  const share = db.shares.find((s: any) => s.id === req.params.id);
  if (!share) {
    res.status(404).json({ error: 'Shared document result not found' });
    return;
  }
  res.json(share);
});

// 4. User History Endpoints
app.get('/api/history', requireAuth, (req: any, res) => {
  const db = readDB();
  const userHistory = db.history.filter((h: any) => h.userId === req.user.id);
  res.json(userHistory.slice(0, 30)); 
});

app.post('/api/history', requireAuth, (req: any, res) => {
  const { title, category, result } = req.body;
  if (!result) {
    res.status(400).json({ error: 'Missing history result body' });
    return;
  }

  const db = readDB();
  const docId = `doc_${Math.random().toString(36).substring(2, 9)}`;
  const newHistory = {
    id: docId,
    title: title || 'Document',
    timestamp: new Date().toISOString(),
    category: category || 'General',
    languageSelected: ['English', 'Telugu', 'Hindi'],
    result: { ...result, id: docId, timestamp: new Date().toISOString() },
    userId: req.user.id
  };

  db.history.unshift(newHistory);
  writeDB(db);

  res.json(newHistory);
});
