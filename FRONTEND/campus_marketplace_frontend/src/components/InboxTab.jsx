import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import '../App.css';

export default function InboxTab() {
  const location = useLocation(); 

  const [currentUserId, setCurrentUserId] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [conversations, setConversations] = useState([]); 
  
  // We now store the entire conversation object for the active chat
  const [activeChatDetails, setActiveChatDetails] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  
  const messagesEndRef = useRef(null);
  
  // Use a ref to strictly track the open chat ID to prevent WebSocket bleeding
  const activeChatIdRef = useRef(null);

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.studentId || decoded.userId;
      setCurrentUserId(userId);
      fetchInbox(userId, token);
    }
  }, []);

  // Sync active chat ref whenever activeChatDetails changes
  useEffect(() => {
    activeChatIdRef.current = activeChatDetails?.partnerId || null;
  }, [activeChatDetails]);

  const fetchInbox = async (userId, token) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/chat/inbox/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMessages = res.data;
      const convosMap = new Map();
      
      allMessages.forEach(msg => {
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!convosMap.has(partnerId)) {
          convosMap.set(partnerId, {
            partnerId: partnerId,
            lastMessage: msg.content,
            timestamp: msg.timestamp
          });
        }
      });
      
      const convoArray = Array.from(convosMap.values());
      
      // Fetch dynamic names & avatars for EVERY person in the inbox
      const detailedConvos = await Promise.all(convoArray.map(async (convo) => {
        let pFullName = `User #${convo.partnerId}`;
        let pShopName = null;
        let pAvatar = null;
        
        try {
          const studentRes = await axios.get(`http://localhost:8081/api/students/${convo.partnerId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          pFullName = studentRes.data.fullName;
          pAvatar = studentRes.data.profileImageUrl;
        } catch(e) {}
        
        try {
          const shopRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${convo.partnerId}`);
          pShopName = shopRes.data.businessName;
          if (!pAvatar && shopRes.data.logoPath) pAvatar = shopRes.data.logoPath;
        } catch(e) {}
        
        return {
          ...convo,
          partnerFullName: pFullName,
          partnerShopName: pShopName,
          partnerAvatar: pAvatar
        };
      }));

      // Sort by newest messages first
      detailedConvos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setConversations(detailedConvos);

      // Keep the active header perfectly synced if a new message comes in!
      if (activeChatIdRef.current) {
        const updatedActive = detailedConvos.find(c => c.partnerId === activeChatIdRef.current);
        if (updatedActive) setActiveChatDetails(updatedActive);
      }

    } catch (error) {
      console.error("Failed to load inbox:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
          const newMsg = JSON.parse(message.body);
          
          // Only append to screen if the sender is the person we are currently chatting with
          if (newMsg.senderId === activeChatIdRef.current) {
            setMessages((prev) => [...prev, newMsg]);
          }
          fetchInbox(currentUserId, localStorage.getItem('jwtToken'));
        });
      }
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate(); 
    // eslint-disable-next-line
  }, [currentUserId]);

  const openChat = async (convoObj) => {
    setActiveChatDetails(convoObj);
    try {
      const res = await axios.get(`http://localhost:8081/api/chat/history/${currentUserId}/${convoObj.partnerId}`);
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Catch incoming redirects from Product Detail Page
  useEffect(() => {
    if (currentUserId && location.state?.startChatWith) {
      const { startChatWith, prefillMessage, merchantName, merchantFullName } = location.state;
      
      const newConvoObj = {
        partnerId: startChatWith,
        partnerShopName: merchantName,
        partnerFullName: merchantFullName || "User",
        lastMessage: "Drafting message...",
        timestamp: new Date().toISOString()
      };
      
      openChat(newConvoObj);
      
      setConversations(prev => {
        if (!prev.find(c => c.partnerId === startChatWith)) {
          return [newConvoObj, ...prev];
        }
        return prev;
      });
      
      if (prefillMessage) setInputText(prefillMessage);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [currentUserId, location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !stompClient || !activeChatDetails) return;

    const chatMessage = {
      senderId: currentUserId,
      receiverId: activeChatDetails.partnerId,
      content: inputText,
      timestamp: new Date().toISOString()
    };

    stompClient.publish({
      destination: "/app/chat",
      body: JSON.stringify(chatMessage)
    });

    setMessages((prev) => [...prev, { ...chatMessage, id: Date.now() }]);
    setInputText("");
    fetchInbox(currentUserId, localStorage.getItem('jwtToken'));
  };

  return (
    <div className="animation-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Inbox <span>& Messages</span></h2>
      </div>

      <div className="chat-container">
        
        {/* --- LEFT SIDEBAR --- */}
        <div className="chat-sidebar">
          {conversations.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <FiMessageSquare size={30} style={{ marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No active conversations.</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <div 
                key={convo.partnerId} 
                className={`chat-convo-item ${activeChatDetails?.partnerId === convo.partnerId ? 'active' : ''}`}
                onClick={() => openChat(convo)}
              >
                <div className="chat-avatar">
                  {convo.partnerAvatar ? (
                    <img src={getImageUrl(convo.partnerAvatar)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : <FiUser />}
                </div>
                
                <div className="chat-convo-details" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                    <span className="chat-convo-name" style={{ fontSize: '15px' }}>
                      {convo.partnerShopName || convo.partnerFullName}
                    </span>
                    {convo.partnerShopName && (
                      <span className="chat-convo-subname" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                        {convo.partnerFullName}
                      </span>
                    )}
                  </div>
                  <span className="chat-convo-preview">{convo.lastMessage}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- RIGHT AREA --- */}
        <div className="chat-window">
          {activeChatDetails ? (
            <>
              {/* --- DYNAMIC HEADER --- */}
              <div className="chat-header">
                <div className="chat-avatar">
                  {activeChatDetails.partnerAvatar ? (
                    <img src={getImageUrl(activeChatDetails.partnerAvatar)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : <FiUser />}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                    {activeChatDetails.partnerShopName || activeChatDetails.partnerFullName}
                  </h3>
                  {activeChatDetails.partnerShopName && (
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>
                      {activeChatDetails.partnerFullName}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="chat-messages-area">
                {messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id || idx} className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="chat-bubble">
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={sendMessage}>
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="Type a message..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
                  <FiSend size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <FiMessageSquare size={50} color="#cbd5e1" />
              <h3>Your Messages</h3>
              <p>Select a conversation from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}