import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { FiSend, FiUser, FiMessageSquare, FiPaperclip, FiX, FiPackage, FiImage, FiFile, FiCheck } from 'react-icons/fi';
import { FaHandshake } from 'react-icons/fa';
import { BsCheckAll } from 'react-icons/bs';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

export default function InboxTab() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState('BUYER'); 
  const [stompClient, setStompClient] = useState(null);
  const [conversations, setConversations] = useState([]); 
  const [activeChatDetails, setActiveChatDetails] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  
  const [allProducts, setAllProducts] = useState([]); 
  
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachTab, setAttachTab] = useState('products'); 
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // --- OFFER MODAL STATES ---
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerStep, setOfferStep] = useState('form'); // 'form' or 'confirm'
  const [offerProductId, setOfferProductId] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const isMessageRead = (msg) => msg.read === true || msg.isRead === true;
  const isMessageOffer = (msg) => msg.offer === true || msg.isOffer === true; 

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.studentId || decoded.userId;
      setCurrentUserId(Number(userId));
      setUserRole(decoded.role); 
      fetchInbox(Number(userId), token);
      fetchAllProducts(); 
    }
  }, []);

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/products');
      setAllProducts(res.data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  useEffect(() => {
    activeChatIdRef.current = activeChatDetails?.partnerId || null;
  }, [activeChatDetails]);

  const fetchInbox = async (uId, token) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/chat/inbox/${uId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMessages = res.data.filter(m => m.content !== "SYSTEM_OFFER_UPDATE"); 
      const convosMap = new Map();
      
      allMessages.forEach(msg => {
        const sId = Number(msg.senderId);
        const rId = Number(msg.receiverId);
        const partnerId = sId === uId ? rId : sId;
        
        let previewText = msg.content;
        if (!previewText || previewText.trim() === "") {
             if (isMessageOffer(msg)) previewText = "🤝 Sent an offer";
             else if (msg.productId) previewText = "📦 Sent a product";
             else if (msg.attachment1) previewText = "📎 Sent an attachment";
        }

        if (!convosMap.has(partnerId)) {
          const isCurrentlyActive = activeChatIdRef.current === partnerId;
          convosMap.set(partnerId, {
            partnerId: partnerId,
            lastMessage: previewText,
            timestamp: msg.timestamp,
            unreadCount: isCurrentlyActive ? 0 : allMessages.filter(m => Number(m.senderId) === partnerId && Number(m.receiverId) === uId && !isMessageRead(m)).length
          });
        }
      });
      
      const convoArray = Array.from(convosMap.values());
      
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
          const shopRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${convo.partnerId}`, {
            validateStatus: status => status < 500 
          });
          if (shopRes.status === 200) {
            pShopName = shopRes.data.businessName;
            if (!pAvatar && shopRes.data.logoPath) pAvatar = shopRes.data.logoPath;
          }
        } catch(e) {}
        
        return { ...convo, partnerFullName: pFullName, partnerShopName: pShopName, partnerAvatar: pAvatar };
      }));

      detailedConvos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setConversations(detailedConvos);

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
          
          if (newMsg.content === "SYSTEM_OFFER_UPDATE") {
              if (activeChatIdRef.current) {
                  axios.get(`http://localhost:8081/api/chat/history/${currentUserId}/${activeChatIdRef.current}`)
                       .then(res => setMessages(res.data.filter(m => m.content !== "SYSTEM_OFFER_UPDATE")));
              }
              return; 
          }

          if (Number(newMsg.senderId) === activeChatIdRef.current) {
            setMessages((prev) => [...prev, newMsg]);
            axios.put(`http://localhost:8081/api/chat/read/${newMsg.senderId}/${currentUserId}`)
              .then(() => {
                 window.dispatchEvent(new Event('chatBadgeUpdate'));
                 fetchInbox(currentUserId, localStorage.getItem('jwtToken'));
              });
          } else {
             fetchInbox(currentUserId, localStorage.getItem('jwtToken'));
             window.dispatchEvent(new Event('chatBadgeUpdate'));
          }
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
    setSelectedProductId(null);
    setSelectedFiles([]);
    
    setConversations(prev => prev.map(c => 
      c.partnerId === convoObj.partnerId ? { ...c, unreadCount: 0 } : c
    ));

    try {
      const res = await axios.get(`http://localhost:8081/api/chat/history/${currentUserId}/${convoObj.partnerId}`);
      setMessages(res.data.filter(m => m.content !== "SYSTEM_OFFER_UPDATE"));
      
      await axios.put(`http://localhost:8081/api/chat/read/${convoObj.partnerId}/${currentUserId}`);
      window.dispatchEvent(new Event('chatBadgeUpdate')); 
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  useEffect(() => {
    if (currentUserId && location.state?.startChatWith) {
      const pId = Number(location.state.startChatWith);
      const { prefillMessage, merchantName, merchantFullName } = location.state;
      const newConvoObj = {
        partnerId: pId,
        partnerShopName: merchantName,
        partnerFullName: merchantFullName || "User",
        lastMessage: prefillMessage || "Drafting message...",
        timestamp: new Date().toISOString(),
        unreadCount: 0
      };
      openChat(newConvoObj);
      setConversations(prev => {
        if (!prev.find(c => Number(c.partnerId) === pId)) return [newConvoObj, ...prev];
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedProductId && selectedFiles.length === 0) || !stompClient || !activeChatDetails || isSending) return;

    setIsSending(true);
    let uploadedUrls = [];

    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append("files", f));
      try {
        const token = localStorage.getItem('jwtToken');
        const uploadRes = await axios.post('http://localhost:8081/api/chat/upload', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls = uploadRes.data.urls || [];
      } catch (error) {
        alert("Failed to upload attachments.");
        setIsSending(false);
        return;
      }
    }

    const chatMessage = {
      senderId: currentUserId,
      receiverId: activeChatDetails.partnerId,
      content: inputText,
      productId: selectedProductId,
      attachment1: uploadedUrls[0] || null,
      attachment2: uploadedUrls[1] || null,
      attachment3: uploadedUrls[2] || null,
      offer: false,
      timestamp: new Date().toISOString()
    };

    stompClient.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
    setMessages((prev) => [...prev, { ...chatMessage, id: Date.now(), read: false }]);
    setInputText("");
    setSelectedProductId(null);
    setSelectedFiles([]);
    setIsSending(false);
    setTimeout(() => fetchInbox(currentUserId, localStorage.getItem('jwtToken')), 500);
  };

  const executeSendOffer = () => {
    if (!offerProductId || !offerPrice || !stompClient || !activeChatDetails || isSending) return;
    
    setIsSending(true);
    const chatMessage = {
      senderId: currentUserId,
      receiverId: activeChatDetails.partnerId,
      content: "I have sent a special offer. Please review.", 
      productId: Number(offerProductId),
      offer: true, 
      isOffer: true, 
      offerPrice: Number(offerPrice),
      offerStatus: "PENDING",
      timestamp: new Date().toISOString()
    };

    stompClient.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
    setMessages((prev) => [...prev, { ...chatMessage, id: Date.now(), read: false }]);
    
    // Reset Modal States
    setShowOfferModal(false);
    setOfferStep('form');
    setOfferProductId("");
    setOfferPrice("");
    setIsSending(false);
    
    setTimeout(() => fetchInbox(currentUserId, localStorage.getItem('jwtToken')), 500);
  };

  const handleOfferResponse = async (messageId, response) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post(`http://localhost:8081/api/orders/respond-offer/${messageId}`, {
        response: response,
        buyerId: currentUserId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      alert(error.response?.data || "Failed to process offer");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) { alert("Maximum 3 files allowed."); return; }
    setSelectedFiles([...selectedFiles, ...files]);
    setShowAttachModal(false);
  };

  const removeFile = (idxToRemove) => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== idxToRemove));
  
  const getRelevantProducts = () => allProducts.filter(p => p.merchantId === currentUserId || p.merchantId === activeChatDetails?.partnerId);
  const getMyProducts = () => allProducts.filter(p => p.merchantId === currentUserId); 
  
  const selectedProdData = getMyProducts().find(p => p.id === Number(offerProductId));

  const renderChatProduct = (prodId) => {
    const p = allProducts.find(prod => prod.id === prodId);
    if (!p) return <div className="chat-product-card unavailable">Product no longer available.</div>;
    const thumbPath = (p.imagePaths && p.imagePaths.length > 0) ? p.imagePaths[0] : p.imagePath;
    return (
      <div className="chat-product-card" onClick={() => navigate(`/product/${p.sku || p.id}`)}>
        <div className="chat-product-img">
          {thumbPath ? <img src={getImageUrl(thumbPath)} alt="Product" /> : <FiPackage />}
        </div>
        <div className="chat-product-info">
          <div className="chat-product-title">{p.title}</div>
          <div className="chat-product-price">₦{p.price.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderFileAttachment = (path) => {
    if (!path) return null;
    const isImage = path.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    return isImage ? (
      <div className="chat-img-attachment"><img src={getImageUrl(path)} alt="Attachment" /></div>
    ) : (
      <a href={getImageUrl(path)} target="_blank" rel="noopener noreferrer" className="chat-file-attachment"><FiFile size={20} /> View Document</a>
    );
  };

  return (
    <div className="animation-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Inbox <span>& Messages</span></h2>
      </div>

      <div className="chat-container">
        <div className="chat-sidebar">
          {conversations.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <FiMessageSquare size={30} style={{ marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No active conversations.</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <div key={convo.partnerId} className={`chat-convo-item ${activeChatDetails?.partnerId === convo.partnerId ? 'active' : ''}`} onClick={() => openChat(convo)}>
                <div className="chat-avatar">
                  {convo.partnerAvatar ? <img src={getImageUrl(convo.partnerAvatar)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FiUser />}
                </div>
                <div className="chat-convo-details" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                    <span className="chat-convo-name" style={{ fontSize: '15px' }}>{convo.partnerShopName || convo.partnerFullName}</span>
                    {convo.partnerShopName && <span className="chat-convo-subname" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{convo.partnerFullName}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="chat-convo-preview" style={{ fontWeight: convo.unreadCount > 0 ? 'bold' : 'normal', color: convo.unreadCount > 0 ? 'var(--color-primary-dark)' : '#64748b' }}>{convo.lastMessage}</span>
                    {convo.unreadCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', marginLeft: '10px' }}>{convo.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-window">
          {activeChatDetails ? (
            <>
              <div className="chat-header">
                <div className="chat-avatar">
                  {activeChatDetails.partnerAvatar ? <img src={getImageUrl(activeChatDetails.partnerAvatar)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <FiUser />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{activeChatDetails.partnerShopName || activeChatDetails.partnerFullName}</h3>
                  {activeChatDetails.partnerShopName && <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{activeChatDetails.partnerFullName}</span>}
                </div>
              </div>
              
              <div className="chat-messages-area">
                {messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId;
                  const isOfferMsg = isMessageOffer(msg);
                  
                  // Compute dynamic price display for offers
                  let showOriginalPrice = false;
                  let originalPriceVal = null;
                  if (isOfferMsg) {
                      const offerProdObj = allProducts.find(prod => prod.id === msg.productId);
                      if (offerProdObj && offerProdObj.price !== msg.offerPrice) {
                          showOriginalPrice = true;
                          originalPriceVal = offerProdObj.price;
                      }
                  }

                  return (
                    <div key={msg.id || idx} className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        
                        {isOfferMsg ? (
                          <div className={`offer-card ${msg.offerStatus?.toLowerCase()}`}>
                            <div className="offer-header">
                               <span>{isMine ? "Offer Sent: Awaiting Response" : "Offer Received: Awaiting Response"}</span>
                               <span className={`offer-badge ${msg.offerStatus?.toLowerCase()}`}>{msg.offerStatus}</span>
                            </div>
                            
                            <div style={{ margin: '15px 0' }}>
                               {renderChatProduct(msg.productId)}
                            </div>

                            <div className="offer-price-row">
                               <span style={{ fontWeight: 'bold' }}>Proposed Price:</span>
                               <div style={{ textAlign: 'right' }}>
                                  {showOriginalPrice && (
                                     <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '13px', marginBottom: '2px' }}>
                                        ₦{originalPriceVal.toLocaleString()}
                                     </div>
                                  )}
                                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-primary-dark)' }}>
                                      ₦{msg.offerPrice?.toLocaleString()}
                                  </span>
                               </div>
                            </div>

                            {!isMine && msg.offerStatus === 'PENDING' && (
                               <div className="offer-actions">
                                  <button className="btn-accept-offer" onClick={() => handleOfferResponse(msg.id, 'ACCEPTED')} disabled={isSending}>
                                    Accept Offer
                                  </button>
                                  <button className="btn-reject-offer" onClick={() => handleOfferResponse(msg.id, 'REJECTED')} disabled={isSending}>
                                    Reject
                                  </button>
                               </div>
                            )}
                          </div>
                        ) : (
                          <div className="chat-bubble" style={{ maxWidth: '100%' }}>
                            {msg.productId && renderChatProduct(msg.productId)}
                            {renderFileAttachment(msg.attachment1)}
                            {renderFileAttachment(msg.attachment2)}
                            {renderFileAttachment(msg.attachment3)}
                            {msg.content && msg.content.trim() !== "" && (
                              <div className="chat-text-content" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           {isMine && (
                             isMessageRead(msg) ? <BsCheckAll color="#3b82f6" size={16} title="Read" /> : <FiCheck color="#94a3b8" size={14} title="Sent" />
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {(selectedProductId || selectedFiles.length > 0) && (
                <div className="chat-preview-zone">
                  {selectedProductId && <div className="preview-chip product-chip"><FiPackage size={14} /> Attached Product <FiX className="preview-close" onClick={() => setSelectedProductId(null)} /></div>}
                  {selectedFiles.map((file, idx) => <div key={idx} className="preview-chip file-chip"><FiImage size={14} /> {file.name.substring(0, 15)}...<FiX className="preview-close" onClick={() => removeFile(idx)} /></div>)}
                </div>
              )}

              <form className="chat-input-area" onSubmit={sendMessage}>
                {userRole === 'MERCHANT' && (
                  <button type="button" className="chat-attach-btn handshake-btn" onClick={() => { setShowOfferModal(true); setOfferStep('form'); }} title="Send an Offer">
                    <FaHandshake size={20} color="#f59e0b" />
                  </button>
                )}
                <button type="button" className="chat-attach-btn" onClick={() => setShowAttachModal(true)} title="Add attachments">
                  <FiPaperclip size={20} />
                </button>
                <input 
                  type="text" className="chat-input" placeholder="Type a message..." 
                  value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isSending}
                />
                <button type="submit" className="chat-send-btn" disabled={(!inputText.trim() && !selectedProductId && selectedFiles.length === 0) || isSending}>
                  {isSending ? '...' : <FiSend size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state"><FiMessageSquare size={50} color="#cbd5e1" /><h3>Your Messages</h3><p>Select a conversation from the sidebar to start chatting.</p></div>
          )}
        </div>
      </div>

      {showAttachModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-card-header">
              <h3>Add Attachment</h3>
              <button className="modal-close-btn" onClick={() => setShowAttachModal(false)}>&times;</button>
            </div>
            
            <div className="dashboard-sub-tabs" style={{ padding: '0 20px', marginTop: '20px', marginBottom: '10px' }}>
              <div className={`dashboard-sub-tab ${attachTab === 'products' ? 'active' : ''}`} onClick={() => setAttachTab('products')}>Store Products</div>
              <div className={`dashboard-sub-tab ${attachTab === 'files' ? 'active' : ''}`} onClick={() => setAttachTab('files')}>Images / Documents</div>
            </div>

            <div className="modal-card-body" style={{ minHeight: '300px', padding: '0 20px 20px 20px' }}>
              {attachTab === 'products' && (
                <div className="attachment-product-list">
                  {getRelevantProducts().length === 0 ? <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>No products found in this transaction context.</p> : (
                    getRelevantProducts().map(p => {
                      const thumb = (p.imagePaths && p.imagePaths.length > 0) ? p.imagePaths[0] : p.imagePath;
                      return (
                        <div key={p.id} className={`attach-product-item ${selectedProductId === p.id ? 'selected' : ''}`} onClick={() => { setSelectedProductId(p.id); setShowAttachModal(false); }}>
                          <div className="attach-product-img">{thumb ? <img src={getImageUrl(thumb)} alt={p.title} /> : <FiPackage />}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{p.title}</div>
                            <div style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold' }}>₦{p.price.toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              {attachTab === 'files' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px' }}>
                  <div className="product-image-upload-zone" onClick={() => fileInputRef.current?.click()} style={{ height: '180px', marginBottom: '15px' }}>
                    <FiImage size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#475569' }}>Click to select files</p>
                  </div>
                  <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- REBUILT MULTI-STEP SEND OFFER MODAL --- */}
      {showOfferModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '450px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-card-header">
              <h3>{offerStep === 'confirm' ? 'Confirm Offer' : 'Create an Offer'}</h3>
              <button className="modal-close-btn" onClick={() => { setShowOfferModal(false); setOfferStep('form'); }}>&times;</button>
            </div>
            
            {offerStep === 'form' ? (
                <form onSubmit={(e) => { e.preventDefault(); setOfferStep('confirm'); }} style={{ padding: '20px' }}>
                   
                   <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label>Select Product to Offer</label>
                      <select 
                         className="form-control" 
                         value={offerProductId} 
                         onChange={(e) => setOfferProductId(e.target.value)} 
                         required
                         style={{ width: '100%', padding: '0 12px', height: '48px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                         <option value="">-- Choose your product --</option>
                         {getMyProducts().map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                         ))}
                      </select>
                      {getMyProducts().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>You have no active products to offer.</span>}
                   </div>

                   {/* DYNAMIC READ-ONLY ORIGINAL PRICE */}
                   {selectedProdData && (
                       <div className="form-group" style={{ marginBottom: '20px' }}>
                          <label>Original Price</label>
                          <div style={{ width: '100%', padding: '0 12px', height: '48px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                             ₦{selectedProdData.price.toLocaleString()}
                          </div>
                       </div>
                   )}

                   <div className="form-group" style={{ marginBottom: '30px' }}>
                      <label>Proposed Price (₦)</label>
                      <input 
                         type="number" 
                         className="form-control" 
                         value={offerPrice} 
                         onChange={(e) => setOfferPrice(e.target.value)} 
                         required
                         placeholder="e.g. 240000"
                         style={{ width: '100%', padding: '0 12px', height: '48px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                   </div>

                   <button type="submit" className="btn-save" style={{ width: '100%', padding: '15px', fontSize: '15px' }} disabled={!offerProductId || !offerPrice}>
                      Review Offer
                   </button>
                </form>
            ) : (
                <div style={{ padding: '25px 20px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Please confirm the details of your offer before sending.</p>
                    
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                        
                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Original Price</p>
                        <h3 style={{ margin: '0 0 20px 0', color: '#64748b', textDecoration: 'line-through' }}>
                           ₦{selectedProdData?.price.toLocaleString()}
                        </h3>
                        
                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Proposed Offer</p>
                        <h2 style={{ margin: 0, color: '#16a34a', fontSize: '32px', fontWeight: '900' }}>
                           ₦{Number(offerPrice).toLocaleString()}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-outline" onClick={() => setOfferStep('form')} style={{ flex: 1, margin: 0 }} disabled={isSending}>Back to Edit</button>
                        <button className="btn-save" onClick={executeSendOffer} style={{ flex: 1, margin: 0 }} disabled={isSending}>
                            {isSending ? 'Sending...' : 'Confirm & Send'}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}