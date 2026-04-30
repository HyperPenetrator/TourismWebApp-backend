const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async getFeed() {
    const response = await fetch(`${API_URL}/feed`);
    if (!response.ok) throw new Error("Failed to fetch feed");
    return response.json();
  },

  async createPost(content: string, token: string, isService: boolean = false, whatsappNumber?: string, price?: string, categoryTag?: string) {
    const response = await fetch(`${API_URL}/create_post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        content, 
        is_service: isService, 
        whatsapp_number: whatsappNumber, 
        price: price,
        category_tag: categoryTag 
      })
    });
    if (!response.ok) throw new Error("Failed to create post");
    return response.json();
  },

  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },

  async register(username: string, email: string, password: string, role: string) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role })
    });
    if (!response.ok) throw new Error("Registration failed");
    return response.json();
  }
};
