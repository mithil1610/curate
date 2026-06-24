import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { GoogleGenAI } from '@google/genai';

export interface ProcessedMenu {
  summary: string;
  categories: {
    Vegan: string[];
    Vegetarian: string[];
    Meat: string[];
  };
  processedAt: string;
}

// In a real app we might not initialize immediately if key is missing,
// but for type safety and simplicity we initialize it here.
let ai: GoogleGenAI | null = null;
try {
    if (process.env.EXPO_PUBLIC_GEMINI_API_KEY && process.env.EXPO_PUBLIC_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
        ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });
    }
} catch (e) {
    console.warn("Could not initialize GoogleGenAI");
}

export async function getOrFetchMenu(restaurantId: string, name: string, tags: string[]): Promise<ProcessedMenu | null> {
  try {
    // 1. Check Firestore Cache
    try {
      const docRef = doc(db, 'menus', restaurantId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ProcessedMenu;
      }
    } catch(e) {
      console.warn("Firestore not reachable (missing API keys?). Using live processing only.");
    }

    // 2. Fetch Mock Raw Menu
    const rawMenu = generateMockRawMenu(name, tags);

    // 3. Process with Gemini
    const processedMenu = await processMenuWithGemini(rawMenu);

    // 4. Cache to Firestore
    if (processedMenu && process.env.EXPO_PUBLIC_GEMINI_API_KEY && process.env.EXPO_PUBLIC_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
      try {
        const docRef = doc(db, 'menus', restaurantId);
        await setDoc(docRef, processedMenu);
      } catch(e) {
        // ignore firestore save errors
      }
    }

    return processedMenu;
  } catch (error) {
    console.error("Error fetching or processing menu:", error);
    return null;
  }
}

async function processMenuWithGemini(rawMenuText: string): Promise<ProcessedMenu | null> {
  if (!ai) {
    return getFallbackMenu();
  }

  const prompt = `
  You are an expert culinary AI. Analyze the following raw restaurant menu.
  Categorize the items into exactly three arrays: "Vegan", "Vegetarian", and "Meat".
  Provide a 1-2 sentence "summary" of the overall cuisine and dining experience.
  
  Format the output exactly as valid JSON matching this schema:
  {
    "summary": "String summary of the cuisine.",
    "categories": {
      "Vegan": ["item 1", "item 2"],
      "Vegetarian": ["item 1", "item 2"],
      "Meat": ["item 1", "item 2"]
    }
  }
  
  Do not include markdown blocks like \`\`\`json. Return only the raw JSON.
  
  Raw Menu:
  ${rawMenuText}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    if (!response.text) return null;
    
    let cleanedText = response.text.trim();
    if (cleanedText.startsWith('\`\`\`json')) cleanedText = cleanedText.substring(7);
    if (cleanedText.startsWith('\`\`\`')) cleanedText = cleanedText.substring(3);
    if (cleanedText.endsWith('\`\`\`')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    
    const parsed = JSON.parse(cleanedText);
    return {
      summary: parsed.summary,
      categories: {
        Vegan: parsed.categories?.Vegan || [],
        Vegetarian: parsed.categories?.Vegetarian || [],
        Meat: parsed.categories?.Meat || [],
      },
      processedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error("Gemini processing error:", e);
    return null;
  }
}

function generateMockRawMenu(name: string, tags: string[]): string {
  return `
    RESTAURANT: ${name}
    CUISINE: ${tags.join(', ')}
    
    STARTERS
    Mixed Greens w/ Vinaigrette - $12
    Crispy Calamari w/ Garlic Aioli - $16
    Beef Tartare - $22
    Roasted Beet Salad (No Cheese) - $14
    
    MAINS
    Wild Caught Salmon w/ Asparagus - $32
    Truffle Mushroom Risotto - $28
    Prime Ribeye Steak 16oz - $55
    Beyond Burger w/ Vegan Bun - $20
    Eggplant Parmesan - $24
    
    DESSERTS
    Chocolate Lava Cake - $12
    Vegan Coconut Sorbet - $10
    Tiramisu - $14
  `;
}

function getFallbackMenu(): ProcessedMenu {
  return {
    summary: "An excellent dining establishment featuring a variety of high-quality dishes (Mock AI Summary).",
    categories: {
      Vegan: ["Mixed Greens w/ Vinaigrette", "Roasted Beet Salad", "Beyond Burger", "Vegan Coconut Sorbet"],
      Vegetarian: ["Truffle Mushroom Risotto", "Eggplant Parmesan", "Chocolate Lava Cake", "Tiramisu"],
      Meat: ["Crispy Calamari", "Beef Tartare", "Wild Caught Salmon", "Prime Ribeye Steak"]
    },
    processedAt: new Date().toISOString()
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithMenuConcierge(
  restaurantName: string,
  menu: ProcessedMenu,
  history: ChatMessage[],
  newQuery: string
): Promise<string> {
  if (!ai) {
    return "I'm currently operating offline and cannot answer chat queries at the moment. Please check the AI summary on the profile page.";
  }

  const systemInstruction = `
You are 'Curate', a sophisticated, polite, and helpful culinary concierge.
You are currently assisting a user with the menu for ${restaurantName}.
Here is the structured menu data you must use as your sole source of truth for menu items:
${JSON.stringify(menu, null, 2)}

Rules:
1. Only recommend or discuss items that are explicitly listed in the menu data above.
2. If the user asks about an item not on the menu, politely inform them it isn't available and suggest an alternative from the menu.
3. Keep your answers concise, conversational, and native to a high-end mobile app experience. Do not use markdown blocks unless formatting a list.
`;

  // Format history for Gemini API
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Add the new query
  contents.push({
    role: 'user',
    parts: [{ text: newQuery }]
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    if (response.text) {
      return response.text;
    } else {
      return "I apologize, but I couldn't formulate a response right now.";
    }
  } catch (error) {
    console.error("Chat error:", error);
    return "I encountered an issue processing your request. Please try again.";
  }
}
