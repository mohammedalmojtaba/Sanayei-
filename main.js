// ============================================================
// 🛠️ SANAYEI (صنايعي) - MAIN APPLICATION SCRIPT (main.js)
// ============================================================

// 1. FIREBASE MODULE IMPORTS (v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🌐 FIREBASE WEB CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDAKQDee6W-ojBZR0MjTEGpiQ0I4KsxzcA",
  authDomain: "sanayei-d359e.firebaseapp.com",
  projectId: "sanayei-d359e",
  storageBucket: "sanayei-d359e.firebasestorage.app",
  messagingSenderId: "246765308017",
  appId: "1:246765308017:web:ec86cee27a8959b9af33d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// 🇸🇩 TIMEZONE UTILITIES (SUDAN / GMT+2)
// ============================================================

// Returns ISO timestamp shifted to Sudan Timezone (GMT+2)
function getSudanISOString() {
  const now = new Date();
  const sudanOffsetMs = 2 * 60 * 60 * 1000; 
  const sudanDate = new Date(now.getTime() + sudanOffsetMs);
  return sudanDate.toISOString();
}

// Returns formatted local Sudan time in Arabic
function getSudanFormattedTime() {
  return new Date().toLocaleString("ar-SD", {
    timeZone: "Africa/Khartoum",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// ============================================================
// 📱 CUSTOMER FUNCTIONS
// ============================================================

/**
 * Creates a new service order with initial status 'pending'
 */
async function createCustomerOrder(customerData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      customerName: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      issueDescription: customerData.issue,
      
      status: "pending",          // Defaults to pending (NOT rejected)
      proposedPrice: null,        // Price empty until technician submits
      createdAt: getSudanISOString() // Sudan timezone timestamp
    });
    
    alert("تم إرسال طلبك بنجاح! في انتظار تحديد السعر من الفني.");
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    alert("حدث خطأ أثناء إرسال الطلب.");
  }
}

/**
 * Customer accepts the technician's proposed price.
 * Updates order status and logs to 'accepted_prices' collection.
 */
async function acceptOrderPrice(orderId, customerName, agreedPrice) {
  try {
    // 1. Update main order document
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: "accepted", // Unlocks phone numbers
      acceptedAt: getSudanISOString()
    });

    // 2. 💾 Log transaction into separate 'accepted_prices' collection
    await addDoc(collection(db, "accepted_prices"), {
      orderId: orderId,
      customerName: customerName,
      agreedPrice: Number(agreedPrice),
      currency: "SDG",
      timestamp: getSudanISOString(),        // ISO String (Sudan GMT+2)
      formattedTime: getSudanFormattedTime() // Human-readable Arabic time
    });

    alert("تم قبول السعر وتبادل أرقام التواصل بنجاح!");
  } catch (error) {
    console.error("Error accepting price:", error);
    alert("حدث خطأ أثناء قبول العرض.");
  }
}

// ============================================================
// 🛠️ TECHNICIAN FUNCTIONS
// ============================================================

/**
 * Technician submits a custom price proposal for a pending order
 */
async function submitTechnicianPrice(orderId, priceAmount) {
  const parsedPrice = Number(priceAmount);
  
  if (!parsedPrice || parsedPrice <= 0) {
    alert("الرجاء إدخال سعر صحيح بالجنية السوداني");
    return;
  }

  try {
    const orderRef = doc(db, "orders", orderId);
    
    // Update order with price proposal
    await updateDoc(orderRef, {
      proposedPrice: parsedPrice,
      status: "price_proposed", // Waiting customer approval
      updatedAt: getSudanISOString()
    });

    alert("تم إرسال عرض السعر للعميل بنجاح!");
  } catch (error) {
    console.error("Error submitting price:", error);
    alert("حدث خطأ أثناء إرسال السعر.");
  }
}

// ============================================================
// 🎨 DYNAMIC UI RENDERERS
// ============================================================

/**
 * Generates HTML for Customer Order Card
 */
function renderCustomerOrderCard(order) {
  const priceDisplay = order.proposedPrice 
    ? `${order.proposedPrice.toLocaleString()} ج.س` 
    : "في انتظار تحديد السعر من الفني...";

  const isAccepted = order.status === "accepted";
  const isProposed = order.status === "price_proposed";

  return `
    <div class="order-card" id="order-${order.id}">
      <h3>الفني: ${order.technicianName || "فني معتمد"}</h3>
      <p><strong>العطل:</strong> ${order.issueDescription}</p>
      <p><strong>العنوان:</strong> ${order.address}</p>
      
      ${isAccepted ? `<p class="tech-phone"><strong>رقم هاتف الفني:</strong> ${order.technicianPhone || "0912345678"}</p>` : ''}

      <div class="price-box">
        <span>التكلفة التقديرية المقترحة:</span>
        <h3 class="price-amount">${priceDisplay}</h3>
      </div>

      ${isProposed ? `
        <button class="btn-accept" onclick="acceptOrderPrice('${order.id}', '${order.customerName}', ${order.proposedPrice})">
          قبول السعر وتبادل الأرقام
        </button>
      ` : ''}

      ${isAccepted ? `
        <div class="status-badge success">تم قبول السعر وتبادل الأرقام بنجاح!</div>
        <a href="tel:${order.technicianPhone || '0912345678'}" class="btn-call">📞 اتصال بالفني</a>
      ` : ''}
    </div>
  `;
}

/**
 * Generates HTML for Technician Order Card
 */
function renderTechnicianOrderCard(order) {
  const isPending = order.status === "pending";
  const isProposed = order.status === "price_proposed";
  const isAccepted = order.status === "accepted";

  return `
    <div class="tech-order-card" id="tech-order-${order.id}">
      <div class="status-tag ${order.status}">${getStatusLabelArabic(order.status)}</div>
      <h3>${order.customerName}</h3>
      <p><strong>الموقع:</strong> ${order.address}</p>
      <p class="issue-box">"${order.issueDescription}"</p>
      
      <p><strong>رقم الهاتف:</strong> ${isAccepted ? order.phone : "🔒 يُكشف بعد موافقة العميل"}</p>
      
      ${isPending ? `
        <div class="price-input-container">
          <input type="number" id="price-${order.id}" placeholder="أدخل التكلفة المقترحة (ج.س)" />
          <button onclick="submitTechnicianPrice('${order.id}', document.getElementById('price-${order.id}').value)">
            إرسال عرض السعر للعميل
          </button>
        </div>
      ` : ''}

      ${(isProposed || isAccepted) ? `
        <p><strong>التكلفة المقدرة:</strong> ${order.proposedPrice ? order.proposedPrice.toLocaleString() : 'غير محدد'} ج.س</p>
      ` : ''}
    </div>
  `;
}

function getStatusLabelArabic(status) {
  switch (status) {
    case "pending": return "جديد";
    case "price_proposed": return "تم تقديم السعر";
    case "accepted": return "تم القبول";
    case "rejected": return "مرفوض";
    default: return status;
  }
}

// Export functions globally to handle inline HTML button triggers (onclick)
window.createCustomerOrder = createCustomerOrder;
window.submitTechnicianPrice = submitTechnicianPrice;
window.acceptOrderPrice = acceptOrderPrice;
window.getSudanISOString = getSudanISOString;
window.getSudanFormattedTime = getSudanFormattedTime;
