import { CartItem } from "../context/CartContext";

export interface ToastOrderPayload {
  restaurantGuid: string;
  checks: {
    selections: {
      item: {
        guid: string;
        name: string;
      };
      quantity: number;
      price: number;
    }[];
  }[];
}

export interface ToastOrderResponse {
  success: boolean;
  orderId: string;
  estimatedPrepTime: string;
  error?: string;
}

export async function submitOrderToToast(
  restaurantId: string, 
  items: CartItem[]
): Promise<ToastOrderResponse> {
  // 1. Map our internal CartItem array to the Toast Orders API Payload format
  const payload: ToastOrderPayload = {
    restaurantGuid: restaurantId || 'mock-restaurant-guid',
    checks: [
      {
        selections: items.map(item => ({
          item: {
            guid: item.id,
            name: item.name
          },
          quantity: item.quantity,
          price: item.price
        }))
      }
    ]
  };

  console.log("Submitting to Toast POS:", JSON.stringify(payload, null, 2));

  // 2. Simulate API Call latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 3. Mock Success Response
  return {
    success: true,
    orderId: `TST-${Math.floor(Math.random() * 1000000)}`,
    estimatedPrepTime: "25-35 minutes"
  };
}
