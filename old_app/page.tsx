"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Repeat2, Send, Share2, MapPin, User, Calendar, LogIn, Phone, ShoppingBag, CheckCircle2, ShieldCheck, Award, Home as HomeIcon } from "lucide-react";
import { api } from "./services/api";
import { ImpactDashboard } from "../components/ImpactDashboard";

type Post = {
  id: string;
  author?: string;
  content: string;
  timestamp: string;
  likes?: number;
  category_tag?: string;
  is_service: boolean;
  whatsapp_number?: string;
  price?: string;
  image_url?: string;
};

const MANDATORY_TAGS = ["#EcoTourism", "#AssamHeritage", "#MedicinalPlants", "#Handicrafts"];

const SAMPLE_HERITAGE_POSTS: Post[] = [
  {
    id: "h1",
    author: "majuli_conservation",
    content: "The golden hour at Majuli is more than just a sunset; it's a centuries-old tradition reflecting on the Brahmaputra. Our stilt houses (Chang Ghar) are standing strong. Come witness the soul of Assam.",
    timestamp: new Date().toISOString(),
    likes: 124,
    category_tag: "#AssamHeritage",
    is_service: false,
    image_url: "/majuli_river_island_1777293832552.png"
  },
  {
    id: "h2",
    author: "kaziranga_wildlife",
    content: "Morning mist in the tall elephant grass. The King of Kaziranga makes a rare appearance. We are working with local communities to ensure these majestic rhinos have a safe home forever.",
    timestamp: new Date().toISOString(),
    likes: 256,
    category_tag: "#EcoTourism",
    is_service: false,
    image_url: "/kaziranga_rhino_1777293860431.png"
  },
  {
    id: "h3",
    author: "ahom_history",
    content: "The terracotta whispers stories of the Ahom Dynasty at Sivasagar. This architecture has survived monsoons and centuries. Preserving this is our collective duty.",
    timestamp: new Date().toISOString(),
    likes: 89,
    category_tag: "#AssamHeritage",
    is_service: false,
    image_url: "/sivasagar_ahom_temple_1777293888153.png"
  }
];

export default function HeritageHome() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"feed" | "profile" | "map" | "notifications">("feed");
  const [showToast, setShowToast] = useState<string | null>(null);

  // Phase 2 States
  const [isServiceMode, setIsServiceMode] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [price, setPrice] = useState("");
  const [selectedTag, setSelectedTag] = useState(MANDATORY_TAGS[0]);

  const notify = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  useEffect(() => {
    fetchFeed();
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFeed();
      // Combine sample heritage posts with real posts
      setPosts([...SAMPLE_HERITAGE_POSTS, ...data]);
    } catch (error) {
      console.error("Error fetching feed:", error);
      setPosts(SAMPLE_HERITAGE_POSTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const data = await api.login("testuser", "testpassword");
      localStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
    } catch (error) {
      alert("Login failed. Using demo mode.");
      setToken("demo_token");
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !token) return;
    
    setIsPosting(true);
    try {
      if (token !== "demo_token") {
        await api.createPost(
          newPost, 
          token, 
          isServiceMode, 
          isServiceMode ? whatsappNumber : undefined,
          isServiceMode ? price : undefined,
          selectedTag
        );
      } else {
        const demoPost: Post = {
          id: Math.random().toString(),
          author: "community_member",
          content: newPost,
          timestamp: new Date().toISOString(),
          is_service: isServiceMode,
          whatsapp_number: whatsappNumber,
          price: price,
          category_tag: selectedTag,
          likes: 0
        };
        setPosts([demoPost, ...posts]);
      }
      setNewPost("");
      setWhatsappNumber("");
      setPrice("");
      setIsServiceMode(false);
      if (token !== "demo_token") await fetchFeed();
    } catch (error) {
      alert("Failed to post.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="main-container animate-fade-in">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-circle"></div>
          <h1>Heritage Threads</h1>
        </div>
        <div className="header-actions">
          {!token ? (
            <button onClick={handleLogin} className="login-pill">
              <LogIn size={16} /> Login
            </button>
          ) : (
            <button className={`profile-pill ${view === 'profile' ? 'active' : ''}`} onClick={() => setView(view === 'feed' ? 'profile' : 'feed')}>
              <User size={16} /> Profile
            </button>
          )}
        </div>
      </header>

      <main>
        {view === "map" ? (
          <div className="empty-state-view">
            <MapPin size={48} />
            <h3>Heritage Map</h3>
            <p>Interactive exploration of Assam's historical sites coming soon.</p>
            <button onClick={() => setView('feed')} className="login-pill">Back to Feed</button>
          </div>
        ) : view === "notifications" ? (
          <div className="empty-state-view">
            <Heart size={48} />
            <h3>Activity</h3>
            <p>Your interactions and community updates will appear here.</p>
            <button onClick={() => setView('feed')} className="login-pill">Back to Feed</button>
          </div>
        ) : view === "profile" ? (
          <div className="profile-section">
            <div className="user-profile-header">
              <div className="profile-avatar">
                <User size={40} />
              </div>
              <div className="profile-info">
                <h2>Arnab Kashyap</h2>
                <p>Heritage Enthusiast • Guwahati, Assam</p>
              </div>
            </div>
            
            <ImpactDashboard />

            <div className="profile-stats-row">
              <div className="p-stat"><strong>12</strong><span>Threads</span></div>
              <div className="p-stat"><strong>450</strong><span>Followers</span></div>
              <div className="p-stat"><strong>230</strong><span>Following</span></div>
            </div>
            
            <div className="profile-tabs">
              <div className="p-tab active">Threads</div>
              <div className="p-tab">Replies</div>
              <div className="p-tab">Impact</div>
            </div>
          </div>
        ) : (
          <>
            {/* Post Creator */}
            <div className="post-input-card">
              <div style={{ display: "flex", gap: "12px" }}>
                <div className="avatar-small"><User size={20} /></div>
                <div style={{ flex: 1 }}>
                  <textarea
                    className="post-textarea"
                    placeholder={token ? "Share a story about Assam's heritage..." : "Click 'Login' above to start sharing..."}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onClick={() => !token && notify("Please login to post!")}
                  />
                  
                  {token && (
                    <div className="post-options">
                      <div className="tag-pill-container">
                        <select className="tag-select-minimal" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                          {MANDATORY_TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                        
                        <label className="service-toggle">
                          <input type="checkbox" checked={isServiceMode} onChange={(e) => setIsServiceMode(e.target.checked)} />
                          <span>Offer Service</span>
                        </label>
                      </div>

                      {isServiceMode && (
                        <div className="service-fields">
                          <input 
                            type="text" 
                            placeholder="WhatsApp Number" 
                            className="minimal-input"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                          />
                          <input 
                            type="text" 
                            placeholder="Price (₹)" 
                            className="minimal-input compact"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="post-footer">
                    <div className="icon-group">
                      <MapPin size={18} />
                      <Calendar size={18} />
                    </div>
                    <button 
                      className={`post-submit-btn ${(!newPost.trim() || !token) ? 'btn-disabled' : 'btn-active'}`} 
                      onClick={() => {
                        if (!token) notify("Login required!");
                        else if (!newPost.trim()) notify("Write something first!");
                        else handlePost();
                      }}
                      disabled={isPosting}
                    >
                      {isPosting ? "..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="feed-container">
              {isLoading && posts.length === 0 ? (
                <div className="loading-state">
                  <div className="shimmer-card"></div>
                  <div className="shimmer-card"></div>
                </div>
              ) : posts.map((post) => (
                <div key={post.id} className={`thread-card ${post.is_service ? 'service-variant' : ''}`}>
                  <div className="thread-layout">
                    <div className="thread-left">
                      <div className="thread-avatar">
                        <User size={20} />
                      </div>
                      <div className="thread-line"></div>
                    </div>
                    <div className="thread-right">
                      <div className="thread-header">
                        <div className="author-meta">
                          <span className="author-name">@{post.author || "local_guide"}</span>
                          {post.is_service && <span className="verified-badge"><ShieldCheck size={12} /> Provider</span>}
                        </div>
                        <span className="timestamp">{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="thread-content">{post.content}</p>
                      
                      {post.image_url && (
                        <div className="thread-image-container">
                          <img src={post.image_url} alt="Heritage" className="thread-image" />
                        </div>
                      )}

                      {post.is_service && (
                        <div className="service-impact-box">
                          <div className="service-info">
                            <span className="service-label">COMMUNITY SERVICE</span>
                            <span className="service-price">{post.price || "Fair Price"}</span>
                          </div>
                          <a 
                            href={`https://wa.me/${post.whatsapp_number}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="contact-btn"
                          >
                            <Phone size={14} /> Book Now
                          </a>
                        </div>
                      )}

                      <div className="thread-tags">
                        <span className="tag-pill">{post.category_tag || "#Assam"}</span>
                      </div>

                      <div className="thread-actions">
                        <button className="action-btn"><Heart size={20} /><span>{post.likes}</span></button>
                        <button className="action-btn"><MessageCircle size={20} /></button>
                        <button className="action-btn"><Repeat2 size={20} /></button>
                        <button className="action-btn"><Send size={20} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={view === 'feed' ? 'active' : ''} onClick={() => setView('feed')}><HomeIcon size={24} /></button>
        <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><MapPin size={24} /></button>
        <div className="nav-plus" onClick={() => notify("Create Feature Coming Soon")}>+</div>
        <button className={view === 'notifications' ? 'active' : ''} onClick={() => setView('notifications')}><Heart size={24} /></button>
        <button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}><User size={24} /></button>
      </nav>

      {showToast && (
        <div className="toast-notification animate-slide-up">
          {showToast}
        </div>
      )}

    </div>
  );
}
