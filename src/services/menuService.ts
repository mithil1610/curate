import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { GoogleGenAI } from '@google/genai';
import { getTasteProfile, TasteProfile } from './userService';

export interface MenuItem {
  item_id: string;
  name: string;
  description: string;
  price: number;
  dietary_flags: {
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    is_keto: boolean;
  };
  known_allergens: string[];
  flavor_profile: string[];
  customization: {
    removable_ingredients: string[];
    protein_add_ons: string[];
  };
  ai_recommendation_notes: string;
}

export interface MenuCategory {
  category_name: string;
  items: MenuItem[];
}

export interface ProcessedMenu {
  restaurant_id: string;
  last_updated: string;
  ai_cuisine_summary: string;
  overall_dietary_rating: {
    vegan_friendly_score: number;
    vegetarian_friendly_score: number;
    gluten_free_friendly_score: number;
  };
  menu_categories: MenuCategory[];
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
    const processedMenu = await processMenuWithGemini(restaurantId, rawMenu);

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

async function processMenuWithGemini(restaurantId: string, rawMenuText: string): Promise<ProcessedMenu | null> {
  if (!ai) {
    return getFallbackMenu(restaurantId);
  }

  const prompt = `
  You are an expert culinary AI. Analyze the following raw restaurant menu.
  Format the output exactly as valid JSON matching this strict schema:
  {
    "restaurant_id": "${restaurantId}",
    "last_updated": "${new Date().toISOString()}",
    "ai_cuisine_summary": "String summary of the overall cuisine and dining experience.",
    "overall_dietary_rating": {
      "vegan_friendly_score": 0-10,
      "vegetarian_friendly_score": 0-10,
      "gluten_free_friendly_score": 0-10
    },
    "menu_categories": [
      {
        "category_name": "Category Name",
        "items": [
          {
            "item_id": "toast_item_xxxx", // Generate a mock ID
            "name": "Item Name",
            "description": "Item Description",
            "price": 10.00, // Numeric price
            "dietary_flags": {
              "is_vegetarian": true/false,
              "is_vegan": true/false,
              "is_gluten_free": true/false,
              "is_keto": true/false
            },
            "known_allergens": ["allergen1", "allergen2"],
            "flavor_profile": ["flavor1", "flavor2"],
            "customization": {
              "removable_ingredients": ["ingredient1", "ingredient2"],
              "protein_add_ons": ["protein1", "protein2"]
            },
            "ai_recommendation_notes": "A brief note on why to recommend this."
          }
        ]
      }
    ]
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
    
    const parsed = JSON.parse(cleanedText) as ProcessedMenu;
    return parsed;
  } catch (e) {
    console.error("Gemini processing error:", e);
    return null;
  }
}

function generateMockRawMenu(name: string, tags: string[]): string {
  // We'll generate a more detailed raw text menu to allow the AI to extract prices, allergens, and dietary flags
  const isVegan = tags.includes('Vegan') || tags.includes('Vegan Options');
  const isSpicy = tags.includes('Thai') || tags.includes('Indian') || tags.includes('Mexican');

  return `
    ${name} - Official Menu

    STARTERS:
    - Edamame ($6.00): Steamed soybeans with sea salt. (Vegan, Gluten-Free) [Contains: Soy]
    - Spring Rolls ($8.50): Crispy rolls stuffed with cabbage, carrots, and glass noodles. Served with sweet chili sauce. (Vegetarian)
    ${isSpicy ? '- Spicy Papaya Salad ($10.00): Green papaya, cherry tomatoes, peanuts, and chili-lime dressing. (Vegetarian, Gluten-Free) [Contains: Peanuts]' : ''}

    MAINS:
    - Signature Bowl ($14.00): Quinoa, roasted sweet potatoes, kale, and tahini dressing. (Vegan, Gluten-Free)
    - Classic Burger ($16.50): 8oz beef patty with lettuce, tomato, and house sauce on a brioche bun. Served with fries. [Contains: Gluten, Dairy]
    ${isVegan ? '- Plant-Based Curry ($15.00): Mixed vegetables in a coconut curry sauce. (Vegan, Gluten-Free) [Contains: Coconut]' : ''}
    - Grilled Chicken Salad ($13.00): Mixed greens, grilled chicken breast, croutons, and parmesan. (Keto Options) [Contains: Dairy, Gluten]

    DESSERTS:
    - Chocolate Lava Cake ($9.00): Warm chocolate cake with a gooey center. [Contains: Gluten, Dairy, Eggs]
    - Mango Sticky Rice ($8.00): Sweet glutinous rice with fresh mango and coconut milk. (Vegan, Gluten-Free)
  `;
}

function getFallbackMenu(restaurantId: string): ProcessedMenu {
  return {
    restaurant_id: restaurantId,
    last_updated: new Date().toISOString(),
    ai_cuisine_summary: "A generic menu fallback since AI processing is unavailable.",
    overall_dietary_rating: {
      vegan_friendly_score: 5,
      vegetarian_friendly_score: 5,
      gluten_free_friendly_score: 5
    },
    menu_categories: [
      {
        category_name: "General Items",
        items: [
          {
            item_id: "toast_item_fallback_1",
            name: "House Salad",
            description: "Fresh mixed greens with a light vinaigrette.",
            price: 8.00,
            dietary_flags: {
              is_vegetarian: true,
              is_vegan: true,
              is_gluten_free: true,
              is_keto: true
            },
            known_allergens: [],
            flavor_profile: ["fresh", "light"],
            customization: {
              removable_ingredients: ["dressing"],
              protein_add_ons: ["chicken", "tofu"]
            },
            ai_recommendation_notes: "A safe and healthy fallback option."
          }
        ]
      }
    ]
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithMenuConcierge(
  restaurantName: string,
  menu: ProcessedMenu,
  history: ChatMessage[],
  newQuery: string,
  groupProfile?: TasteProfile | null
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return "I'm sorry, I'm currently unavailable. (API Key missing)";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use group profile if provided, else fetch individual profile
  const profile = groupProfile || await getTasteProfile();
  let profileContext = "";
  if (profile) {
    if (groupProfile) {
      profileContext = `
Group Mode is ACTIVE. You are recommending food for TWO people.
The users have the following COMBINED Deep Taste Profile:
- Dietary Baseline: ${profile.dietaryBaseline || 'None'}
- Strict Allergies: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
- Personal Tastes: ${profile.personalTastes || 'None specified'}

CRITICAL INSTRUCTION: You MUST strictly warn the users against any menu items that violate their COMBINED allergies. You must recommend shared appetizers and distinct meals that perfectly satisfy BOTH users' tastes based on this Combined Profile.
`;
    } else {
      profileContext = `
The user has the following Deep Taste Profile:
- Dietary Baseline: ${profile.dietaryBaseline || 'None'}
- Strict Allergies: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
- Personal Tastes: ${profile.personalTastes || 'None specified'}

CRITICAL INSTRUCTION: You MUST strictly warn the user against any menu items that violate their allergies. If they ask for recommendations, filter out items that don't match their Dietary Baseline or Allergies. Tailor your recommendations to their Personal Tastes.
`;
    }
  }

  const systemInstruction = `
You are Curate, an elegant, highly sophisticated culinary concierge.
You are currently assisting a user at the restaurant: ${restaurantName}.
Here is the AI-processed menu for this restaurant in JSON format:
${JSON.stringify(menu, null, 2)}

${profileContext}

Your persona:
- You are knowledgeable about food, wine, and culinary techniques.
- You speak clearly, concisely, and with a touch of high-end hospitality (e.g., "Certainly," "I highly recommend," "An excellent choice").
- You strictly rely on the provided menu JSON. Do not invent dishes that are not on the menu.
- Answer user questions based ONLY on the menu context provided.
- If a user asks for a recommendation, consider their dietary restrictions if they mentioned any, and reference the categories provided in the JSON.
- If you use the addToCart tool, confirm the addition naturally in your response, but keep it brief.
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

  const tools = [{
    functionDeclarations: [
      {
        name: 'addToCart',
        description: 'Adds an item from the menu to the user\'s shopping cart.',
        parameters: {
          type: 'OBJECT',
          properties: {
            itemName: {
              type: 'STRING',
              description: 'The exact name of the item as it appears on the menu.'
            },
            quantity: {
              type: 'INTEGER',
              description: 'The number of this item to add to the cart. Defaults to 1.'
            }
          },
          required: ['itemName', 'quantity']
        }
      }
    ]
  }];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools as any
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'addToCart') {
        const { itemName, quantity } = call.args as any;
        return `__TOOL_CALL__:addToCart:${itemName}:${quantity}`;
      }
    }

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
