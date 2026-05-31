import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  // Backgrounds
  obsidian:"#FDFAF5",     // page background — warm white
  ink:"#F7F2EA",          // section alt background — cream
  card:"#FFFFFF",         // card background — white
  cardHover:"#FEFCF7",    // card hover — very warm white
  // Borders
  border:"rgba(197,151,58,0.22)",
  borderHover:"rgba(14,43,31,0.3)",
  // Brand
  gold:"#C5973A",
  goldLight:"#E8C870",
  goldDim:"rgba(197,151,58,0.10)",
  // Text
  cream:"#1C1C1C",        // primary text — charcoal
  muted:"#6B6B5F",        // muted text
  mutedLight:"#4A4A42",   // slightly lighter muted
  white:"#FDFAF5",        // used for text on dark backgrounds
  light:"#F7F2EA",         // light text on dark backgrounds
  // Brand greens
  sage:"#0E2B1F",         // forest green — nav, headers
  sageLight:"#2D5C44",    // sage
  // Semantic
  error:"#DC2626",
  success:"#16A34A",
  successDim:"rgba(22,163,74,0.10)",
  booked:"rgba(220,38,38,0.08)",
  blockedText:"#DC2626",
};

// ─── HELPERS ──────────────────────────────────────────────────────
const fmt = n => n?.toLocaleString() ?? "—";
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—";
const toKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const nightsBetween = (a,b) => {
  if (!a||!b) return 0;
  return Math.round((new Date(b)-new Date(a))/(1000*60*60*24));
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr+"T00:00:00"); d.setDate(d.getDate()+n); return toKey(d);
};
const genRef = () => "SHK-"+ Math.random().toString(36).slice(2,8).toUpperCase();
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── DEFAULT DATA ─────────────────────────────────────────────────
const DEFAULT_LISTINGS = [
  { id:"lst-001", name:"The Westlands Penthouse", neighborhood:"Westlands", city:"Nairobi",
    tagline:"Sweeping city views from the 18th floor", type:"Penthouse Suite",
    bedrooms:2, bathrooms:2, guests:4, sqm:110, pricePerNight:8500, cleaningFee:1500,
    rating:4.97, reviewCount:84, badge:"Guest Favourite", available:true,
    amenities:["WiFi","Smart TV","Netflix","Kitchen","Gym Access","Rooftop Pool","Parking","24/7 Security","City View","Air Conditioning"],
    photos:["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=85","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85","https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=85","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=85","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=85"],
    description:"Wake up above the city in this spectacular penthouse apartment. Floor-to-ceiling glass wraps the living space, framing a panorama of Nairobi's skyline at golden hour. The open-plan kitchen is fully equipped, the master suite has a walk-in wardrobe, and residents enjoy rooftop pool and gym access.\n\nPerfect for corporate travellers and couples seeking an elevated stay.",
    houseRules:["No smoking","No parties","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-03","2026-06-04","2026-06-05","2026-06-12","2026-06-13"],
    lat:-1.2676,lng:36.8119,locationNote:"15th floor of Westlands Square. Use the south entrance on Mpaka Road. Parking in basement B2." },
  { id:"lst-002", name:"Kilimani Garden Studio", neighborhood:"Kilimani", city:"Nairobi",
    tagline:"Leafy calm in the heart of the city", type:"Studio",
    bedrooms:1, bathrooms:1, guests:2, sqm:45, pricePerNight:3200, cleaningFee:800,
    rating:4.91, reviewCount:132, badge:"Popular", available:true,
    amenities:["WiFi","Smart TV","Netflix","Kitchenette","Garden Access","Secure Parking","Security"],
    photos:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=85","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=85","https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=85"],
    description:"A beautifully designed studio tucked behind lush gardens in Kilimani — one of Nairobi's most coveted addresses. Minimalist interiors with warm wood tones, a queen bed, and a fully-fitted kitchenette. Walk to Java, Carrefour and the best cafes in under 5 minutes.\n\nIdeal for solo travellers or couples on short business or leisure stays.",
    houseRules:["No smoking","No parties","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-08","2026-06-09","2026-06-20","2026-06-21","2026-06-22"],
    lat:-1.2921,lng:36.7863,locationNote:"Off Argwings Kodhek Road. Gate is green — ring the bell and mention Shikaz Homes. Parking within compound." },
  { id:"lst-003", name:"Lavington Family Retreat", neighborhood:"Lavington", city:"Nairobi",
    tagline:"Space, comfort & a garden for the whole family", type:"2-Bedroom Apartment",
    bedrooms:2, bathrooms:2, guests:5, sqm:130, pricePerNight:11000, cleaningFee:2000,
    rating:4.94, reviewCount:57, badge:"New", available:true,
    amenities:["WiFi","Smart TV","Full Kitchen","Washing Machine","Kids Play Area","Private Garden","Parking","Security","Netflix","Air Conditioning"],
    photos:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85","https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=85","https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&q=85","https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=85"],
    description:"Nairobi's most family-friendly short stay. This generous 2-bedroom apartment sits in a quiet compound in Lavington, with a private garden, fully equipped kitchen, and laundry. Space for everyone — adults and children alike.\n\nClose to Lavington Mall, international schools, and a short drive from the CBD.",
    houseRules:["No smoking","Quiet hours 10PM–7AM","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-15","2026-06-16","2026-06-17","2026-06-28","2026-06-29"],
    lat:-1.2780,lng:36.7627,locationNote:"Off James Gichuru Road, second compound on the left. Blue gate with a mango tree. Free parking inside." },
  { id:"lst-004", name:"Parklands Executive Suite", neighborhood:"Parklands", city:"Nairobi",
    tagline:"Corporate-grade comfort in a quiet enclave", type:"1-Bedroom Suite",
    bedrooms:1, bathrooms:1, guests:2, sqm:65, pricePerNight:5500, cleaningFee:1000,
    rating:4.88, reviewCount:96, badge:"Business Pick", available:true,
    amenities:["WiFi","Workspace","Smart TV","Kitchen","Gym","Pool","Parking","Security","Iron & Board"],
    photos:["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85","https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=85","https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&q=85","https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200&q=85"],
    description:"Purpose-built for the business traveller who refuses to compromise. A crisp, modern 1-bedroom suite with a dedicated workspace, high-speed fibre WiFi, and a fully equipped kitchen. The building has a pool and gym — unwind after a long day in Nairobi.\n\nClose to Aga Khan Hospital, UN offices, and Westlands business district.",
    houseRules:["No smoking","No parties","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-02","2026-06-10","2026-06-11","2026-06-25"],
    lat:-1.2593,lng:36.8219,locationNote:"Apollo Centre, 3rd Parklands Avenue. Check in at the reception desk — they'll direct you to the suite. Visitor parking available." },
  { id:"lst-005", name:"Riverside Loft", neighborhood:"Riverside", city:"Nairobi",
    tagline:"Industrial chic meets Nairobi's creative quarter", type:"Loft Studio",
    bedrooms:1, bathrooms:1, guests:2, sqm:60, pricePerNight:4800, cleaningFee:1000,
    rating:4.93, reviewCount:43, badge:"Design Pick", available:true,
    amenities:["WiFi","Smart TV","Kitchenette","Art Collection","River View","Secure Access","Netflix"],
    photos:["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=85","https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=85","https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&q=85"],
    description:"A double-height loft in the creative Riverside neighbourhood. Exposed concrete, warm pendant lighting, and curated local art make this a truly memorable space. The bed sits on a mezzanine above an open living area with river-facing windows.\n\nFive minutes from Nairobi's best restaurants and gallery spaces.",
    houseRules:["No smoking","No parties","Respect art pieces","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-06","2026-06-07","2026-06-18","2026-06-19"],
    lat:-1.2872,lng:36.7981,locationNote:"Riverside Drive, cream building opposite the Muthaiga roundabout side. Apartment is on the 2nd floor, unit 2C. Intercom at gate." },
  { id:"lst-006", name:"Karen Countryside Villa", neighborhood:"Karen", city:"Nairobi",
    tagline:"A private villa among acacia and bougainvillea", type:"3-Bedroom Villa",
    bedrooms:3, bathrooms:3, guests:7, sqm:280, pricePerNight:22000, cleaningFee:4000,
    rating:4.99, reviewCount:28, badge:"Luxury", available:true,
    amenities:["WiFi","Smart TV","Full Kitchen","Private Pool","BBQ","Gardener","Housekeeper","Parking x4","Generator","Air Conditioning","Netflix","Fireplace"],
    photos:["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85","https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85","https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&q=85"],
    description:"The crown jewel of Shikaz Homes. Set on half an acre in Karen, this three-bedroom villa offers absolute privacy, a heated private pool, outdoor BBQ and a fully staffed experience. Mornings begin with garden breakfasts and sunsets end by the fireplace.\n\nIdeal for families, special celebrations, and executives seeking a genuine retreat.",
    houseRules:["No loud music after 10PM","Max 7 guests","No smoking indoors","Check-in 3PM","Checkout 11AM"],
    bookedDates:["2026-06-01","2026-06-14","2026-06-30"],
    lat:-1.3500,lng:36.7100,locationNote:"Off Karen Road, past the Karen Blixen Museum — brown timber gate, look for the Shikaz Homes sign. Caretaker on site to welcome you." },
];

const BADGE_STYLE = {
  "Guest Favourite":{ bg:"rgba(212,175,95,0.15)", color:C.gold,      border:`1px solid rgba(212,175,95,0.35)` },
  "Popular":        { bg:"rgba(94,181,120,0.12)", color:"#5EB578",   border:"1px solid rgba(94,181,120,0.3)"  },
  "New":            { bg:"rgba(100,160,220,0.12)",color:"#64A0DC",   border:"1px solid rgba(100,160,220,0.3)" },
  "Business Pick":  { bg:"rgba(160,130,220,0.12)",color:"#A082DC",   border:"1px solid rgba(160,130,220,0.3)" },
  "Design Pick":    { bg:"rgba(220,120,100,0.12)",color:"#DC7864",   border:"1px solid rgba(220,120,100,0.3)" },
  "Luxury":         { bg:"rgba(212,175,95,0.20)", color:C.goldLight, border:`1px solid rgba(212,175,95,0.5)`  },
};

async function loadListings() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:listings").single();
    if (error || !data) return DEFAULT_LISTINGS;
    return JSON.parse(data.value);
  } catch { return DEFAULT_LISTINGS; }
}
async function saveListings(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:listings", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}
async function loadBookings() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:bookings").single();
    if (error || !data) return [];
    return JSON.parse(data.value);
  } catch { return []; }
}
async function saveBookings(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:bookings", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const GS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:#FDFAF5;color:#1C1C1C;overflow-x:hidden}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#F7F2EA}::-webkit-scrollbar-thumb{background:rgba(197,151,58,0.45);border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
@keyframes popIn{0%{opacity:0;transform:scale(0.7) translateY(60px)}70%{transform:scale(1.04) translateY(-6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes popOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.8) translateY(40px)}}
@keyframes floatUp{0%{opacity:0;transform:translateY(0)}10%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-80px)}}
@keyframes swing{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(720deg);opacity:0}}
@keyframes firework{0%{transform:scale(0);opacity:1}100%{transform:scale(1.5);opacity:0}}
@keyframes ribbonSlide{0%{transform:translateX(-110%)}100%{transform:translateX(0)}}
@keyframes heartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.2)}70%{transform:scale(1)}}
@keyframes starTwinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.6)}}
@keyframes rotateSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(197,151,58,0.4)}50%{box-shadow:0 0 60px rgba(197,151,58,0.9),0 0 100px rgba(197,151,58,0.4)}}
@keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes flagWave{0%,100%{transform:skewX(0deg)}25%{transform:skewX(-3deg)}75%{transform:skewX(3deg)}}
@keyframes drip{0%{transform:scaleY(0);transform-origin:top}100%{transform:scaleY(1);transform-origin:top}}
@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:0.5}30%{transform:translateY(-6px);opacity:1}}
@keyframes conciergeRing{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.9);opacity:0}}
@keyframes conciergeOpen{0%{opacity:0;transform:scale(0.85) translateY(20px);transform-origin:bottom right}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes scanline{0%{top:0%}100%{top:100%}}
@keyframes disco{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
.fade-up{animation:fadeUp 0.7s ease both}
input,select,textarea,button{font-family:inherit}
a{text-decoration:none;color:inherit}
`;

// ─── NAV ──────────────────────────────────────────────────────────
function Nav({ onNavigate }) {
  const [scrolled,setScrolled]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [mobile,setMobile]=useState(window.innerWidth<768);
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>60);
    const onResize=()=>setMobile(window.innerWidth<768);
    window.addEventListener("scroll",onScroll);
    window.addEventListener("resize",onResize);
    return()=>{ window.removeEventListener("scroll",onScroll); window.removeEventListener("resize",onResize); };
  },[]);

  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:900,background:"rgba(14,43,31,0.97)",backdropFilter:"blur(18px)",borderBottom:`1px solid ${scrolled?C.border:"transparent"}`,transition:"all 0.35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",height:"64px",maxWidth:"1400px",margin:"0 auto"}}>
        <button onClick={()=>{onNavigate("home");setMenuOpen(false);}} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",fontWeight:600,color:"#F7F2EA",flexShrink:0}}>
          Shikaz<span style={{color:C.gold,fontStyle:"italic"}}>Homes</span>
        </button>

        {/* Desktop links */}
        {!mobile&&(
          <div style={{display:"flex",alignItems:"center",gap:"1.5rem"}}>
            {["Listings","About","Contact"].map(l=>(
              <button key={l} onClick={()=>onNavigate(l.toLowerCase())} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.75rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(247,242,234,0.75)",transition:"color 0.2s",padding:"0.25rem 0"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="rgba(247,242,234,0.75)"}>{l}</button>
            ))}
            <button onClick={()=>onNavigate("refer")} style={{background:`linear-gradient(135deg,${C.gold},#D4AF37)`,border:"none",cursor:"pointer",fontSize:"0.7rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#0E2B1F",padding:"0.4rem 0.85rem",borderRadius:"4px",fontWeight:700,transition:"opacity 0.2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>💰 Refer & Earn</button>
            <button onClick={()=>onNavigate("admin")} style={{background:"transparent",border:"1px solid rgba(247,242,234,0.3)",color:"#F7F2EA",padding:"0.5rem 1.2rem",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",borderRadius:"3px",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}} onMouseLeave={e=>{e.target.style.borderColor="rgba(247,242,234,0.3)";e.target.style.color="#F7F2EA";}}>Host Login</button>
          </div>
        )}

        {/* Mobile hamburger */}
        {mobile&&(
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"none",border:"none",color:"#F7F2EA",fontSize:"1.5rem",cursor:"pointer",padding:"0.25rem",lineHeight:1}}>
            {menuOpen?"✕":"☰"}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {mobile&&menuOpen&&(
        <div style={{background:"rgba(14,43,31,0.99)",borderTop:"1px solid rgba(197,151,58,0.2)",padding:"1rem 1.5rem 1.5rem",display:"flex",flexDirection:"column",gap:"0.2rem",animation:"fadeIn 0.2s ease"}}>
          {["Listings","About","Contact"].map(l=>(
            <button key={l} onClick={()=>{onNavigate(l.toLowerCase());setMenuOpen(false);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(247,242,234,0.8)",padding:"0.75rem 0",textAlign:"left",borderBottom:"1px solid rgba(247,242,234,0.08)",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="rgba(247,242,234,0.8)"}>{l}</button>
          ))}
          <button onClick={()=>{onNavigate("mybooking");setMenuOpen(false);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(247,242,234,0.8)",padding:"0.75rem 0",textAlign:"left",borderBottom:"1px solid rgba(247,242,234,0.08)",transition:"color 0.2s"}}>My Booking</button>
          <button onClick={()=>{onNavigate("refer");setMenuOpen(false);}} style={{marginTop:"0.5rem",background:`linear-gradient(135deg,${C.gold},#D4AF37)`,color:"#0E2B1F",border:"none",padding:"0.85rem 1.5rem",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",borderRadius:"4px",cursor:"pointer",textAlign:"left"}}>💰 Refer & Earn</button>
          <button onClick={()=>{onNavigate("admin");setMenuOpen(false);}} style={{marginTop:"0.4rem",background:"transparent",border:"1px solid rgba(247,242,234,0.25)",color:"rgba(247,242,234,0.7)",padding:"0.75rem 1.5rem",fontSize:"0.82rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",borderRadius:"4px",cursor:"pointer"}}>Host Login</button>
        </div>
      )}
    </nav>
  );
}

// ─── AVAILABILITY CALENDAR ────────────────────────────────────────
function AvailCalendar({ bookedDates=[], checkIn, checkOut, onSelect }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = toKey(today);
  const [year,setYear]=useState(today.getFullYear());
  const [month,setMonth]=useState(today.getMonth());
  const [hovered,setHovered]=useState(null);

  const booked = new Set(bookedDates);

  const prevM=()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextM=()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const inRange=(key)=>{
    if(!checkIn||(!checkOut&&!hovered)) return false;
    const end=checkOut||hovered;
    return key>checkIn&&key<end;
  };

  const daysInMonth = new Date(year,month+1,0).getDate();
  const firstDay    = new Date(year,month,1).getDay();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const handleDay=(d)=>{
    if(!d) return;
    const key=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if(booked.has(key)||key<todayKey) return;
    if(!checkIn||(checkIn&&checkOut)){
      onSelect({checkIn:key,checkOut:null});
    } else {
      if(key<=checkIn){ onSelect({checkIn:key,checkOut:null}); return; }
      // block if booked date in range
      let cur=addDays(checkIn,1);
      while(cur<key){ if(booked.has(cur)){onSelect({checkIn:key,checkOut:null});return;} cur=addDays(cur,1); }
      onSelect({checkIn,checkOut:key});
    }
  };

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"8px",overflow:"hidden",boxShadow:"0 2px 10px rgba(14,43,31,0.06)"}}>
      {/* Nav */}
      <div style={{background:"#0E2B1F",padding:"1rem 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
        <button onClick={prevM} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#F7F2EA",width:"30px",height:"30px",borderRadius:"4px",cursor:"pointer",fontSize:"1rem",transition:".2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="#F7F2EA"}>‹</button>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#F7F2EA",fontWeight:500}}>{MONTHS[month]} {year}</span>
        <button onClick={nextM} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#F7F2EA",width:"30px",height:"30px",borderRadius:"4px",cursor:"pointer",fontSize:"1rem",transition:".2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="#F7F2EA"}>›</button>
      </div>
      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0.7rem 0.8rem 0.2rem"}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.6rem",letterSpacing:"0.12em",textTransform:"uppercase",color:C.muted}}>{d}</div>)}
      </div>
      {/* Cells */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",padding:"0.2rem 0.8rem 0.8rem"}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const key=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isPast    = key<todayKey;
          const isBooked  = booked.has(key);
          const isCheckIn = key===checkIn;
          const isCheckOut= key===checkOut;
          const isInRange = inRange(key);
          const isToday   = key===todayKey;
          const disabled  = isPast||isBooked;
          let bg="transparent", color=disabled?C.muted:C.mutedLight, border="none", br="4px";
          if(isCheckIn||isCheckOut){ bg=C.gold; color=C.obsidian; br="50%"; }
          else if(isInRange){ bg=C.goldDim; color=C.gold; }
          else if(isBooked){ bg=C.booked; color=C.muted; }
          return (
            <div key={key}
              onClick={()=>handleDay(d)}
              onMouseEnter={()=>{ if(!disabled&&checkIn&&!checkOut) setHovered(key); }}
              onMouseLeave={()=>setHovered(null)}
              style={{position:"relative",minHeight:"34px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:br,background:bg,color,cursor:disabled?"not-allowed":"pointer",transition:"all 0.15s",userSelect:"none"}}
            >
              <span style={{fontSize:"0.75rem",fontWeight:isToday?700:400,color:isToday&&!isCheckIn&&!isCheckOut?C.gold:undefined}}>{d}</span>
              {isBooked&&<span style={{fontSize:"0.42rem",color:C.blockedText,letterSpacing:"0.05em",lineHeight:1}}>booked</span>}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{display:"flex",gap:"1.2rem",padding:"0.6rem 1rem 0.9rem",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
        {[{col:C.gold,label:"Selected"},{col:C.goldDim,label:"Your stay"},{col:C.booked,label:"Booked"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.65rem",color:C.muted}}>
            <div style={{width:"10px",height:"10px",borderRadius:"2px",background:l.col,border:`1px solid ${C.border}`}}/>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRICE BREAKDOWN ──────────────────────────────────────────────
function PriceBreakdown({ listing, checkIn, checkOut, guests }) {
  const nights = nightsBetween(checkIn, checkOut);
  if (!nights) return null;
  const subtotal = nights * listing.pricePerNight;
  const total    = subtotal + listing.cleaningFee;
  return (
    <div style={{background:"rgba(197,151,58,0.08)",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"1rem 1.2rem",animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:"0.72rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.7rem"}}>Price Breakdown</div>
      {[
        [`KES ${fmt(listing.pricePerNight)} × ${nights} night${nights>1?"s":""}`, `KES ${fmt(subtotal)}`],
        ["Cleaning fee", `KES ${fmt(listing.cleaningFee)}`],
      ].map(([l,r])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.83rem",color:C.mutedLight,padding:"0.3rem 0"}}><span>{l}</span><span>{r}</span></div>
      ))}
      <div style={{borderTop:`1px solid ${C.border}`,marginTop:"0.5rem",paddingTop:"0.6rem",display:"flex",justifyContent:"space-between",fontSize:"1rem",fontWeight:600,color:C.gold}}>
        <span>Total</span><span>KES {fmt(total)}</span>
      </div>
      <div style={{fontSize:"0.68rem",color:C.muted,marginTop:"0.4rem",textAlign:"right"}}>{fmtDate(checkIn)} → {fmtDate(checkOut)} · {guests} guest{guests>1?"s":""}</div>
    </div>
  );
}

// ─── MPESA PAYMENT MODAL ──────────────────────────────────────────
// PayHero credentials — set these in your .env file
// VITE_PAYHERO_USERNAME, VITE_PAYHERO_PASSWORD, VITE_PAYHERO_CHANNEL_ID
const PH_USER    = import.meta.env.VITE_PAYHERO_USERNAME ?? "";
const PH_PASS    = import.meta.env.VITE_PAYHERO_PASSWORD ?? "";
const PH_CHANNEL = import.meta.env.VITE_PAYHERO_CHANNEL_ID ?? "";
const phAuth     = () => btoa(`${PH_USER}:${PH_PASS}`);

async function phStkPush({ phone, amount, ref }) {
  const res = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Basic ${phAuth()}` },
    body: JSON.stringify({
      amount,
      phone_number: phone,
      channel_id: Number(PH_CHANNEL),
      provider: "m-pesa",
      external_reference: ref,
      callback_url: window.location.origin + "/",
    }),
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data?.message || `PayHero ${res.status}`);
  return data;
}

async function phCheckStatus(reference) {
  const res = await fetch(
    `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
    { headers:{ "Authorization":`Basic ${phAuth()}` } }
  );
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return data;
}

function PaymentModal({ listing, checkIn, checkOut, guests, onClose, onSuccess, customAmount, isDeposit, holidayDiscount }) {
  const nights  = nightsBetween(checkIn,checkOut);
  const baseTotal = nights*listing.pricePerNight + listing.cleaningFee;
  const discountedTotal = holidayDiscount
    ? Math.round(baseTotal * (1 - holidayDiscount/100))
    : baseTotal;
  const discountSaving  = baseTotal - discountedTotal;
  const total   = (isDeposit && customAmount) ? customAmount : discountedTotal;
  const balanceDue = isDeposit ? discountedTotal - total : 0;

  const [step,setStep]=useState("form");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [err,setErr]=useState("");
  const [statusMsg,setStatusMsg]=useState("");
  const [phRef,setPhRef]=useState(null);
  const bookingRef = useState(()=>genRef())[0];
  const pollRef    = useRef(null);

  // Clean up poll on unmount
  useEffect(()=>()=>{ if(pollRef.current) clearInterval(pollRef.current); },[]);

  const validatePhone=p=>/^(?:254|0)[17]\d{8}$/.test(p.replace(/\s/g,""));
  const normalisePhone=p=>{ const c=p.replace(/\s/g,""); return c.startsWith("0")?"254"+c.slice(1):c; };

  const submit=async()=>{
    if(!name.trim()){ setErr("Please enter your full name."); return; }
    if(!validatePhone(phone)){ setErr("Enter a valid Safaricom number (07xx or 254xx)."); return; }
    // Check env vars are configured
    if(!PH_USER || !PH_PASS || !PH_CHANNEL){
      setErr("Payment not configured — please set VITE_PAYHERO_USERNAME, VITE_PAYHERO_PASSWORD, and VITE_PAYHERO_CHANNEL_ID in your .env file.");
      return;
    }
    setErr(""); setStep("sending");
    try {
      const data = await phStkPush({
        phone: normalisePhone(phone),
        amount: total,
        ref: bookingRef,
      });
      // PayHero returns reference or CheckoutRequestID
      const extRef = data?.reference || data?.CheckoutRequestID || data?.checkout_request_id || bookingRef;
      setPhRef(extRef);
      setStep("waitPin");
      // Start polling after 6 s — give user time to see the prompt and enter PIN
      setTimeout(()=>startPolling(extRef), 6000);
    } catch(e) {
      setErr(`STK push failed: ${e.message}. Check your PayHero credentials and try again.`);
      setStep("form");
    }
  };

  const startPolling=(ref)=>{
    setStep("polling");
    setStatusMsg("Verifying payment…");
    let attempts = 0;
    const MAX = 20; // ~100 s total
    pollRef.current = setInterval(async()=>{
      attempts++;
      try {
        const data = await phCheckStatus(ref);
        const st = (data?.status || "").toUpperCase();
        if(["SUCCESS","COMPLETE","COMPLETED"].includes(st)){
          clearInterval(pollRef.current);
          setStep("success");
        } else if(["FAILED","CANCELLED","CANCELED","REJECTED"].includes(st)){
          clearInterval(pollRef.current);
          setErr(data?.message || "Payment was cancelled or failed. Please try again.");
          setStep("failed");
        } else if(attempts >= MAX){
          clearInterval(pollRef.current);
          setErr(`Verification timed out. If you entered your PIN, contact us with ref: ${bookingRef}`);
          setStep("failed");
        } else {
          setStatusMsg(`Waiting for M-Pesa confirmation… (${attempts}/${MAX})`);
        }
      } catch {
        // network blip — keep polling
      }
    }, 5000);
  };

  const confirmPay=()=>{}; // kept for compat but no longer used

  const handleSuccess=()=>{
    onSuccess({
      ref:bookingRef, name, phone:normalisePhone(phone),
      checkIn, checkOut, guests, listing,
      total, nights,
      isDeposit, depositAmount:isDeposit?total:null,
      balanceDue, holidayDiscount,
    });
    onClose();
  };

  const overlay={position:"fixed",inset:0,background:"rgba(14,43,31,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(8px)"};
  const box={background:"#fff",border:`1px solid ${C.border}`,borderRadius:"12px",width:"100%",maxWidth:"480px",padding:"2.2rem",animation:"slideUp 0.35s ease",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",maxHeight:"92vh",overflowY:"auto"};

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={box}>
        <button onClick={onClose} style={{position:"absolute",top:"1rem",right:"1rem",background:"none",border:"none",color:C.muted,fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>✕</button>

        {/* Header */}
        <div style={{marginBottom:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.4rem"}}>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(197,151,58,0.9)"}}>
              {step==="success"?(isDeposit?"Deposit Confirmed":"Booking Confirmed"):step==="failed"?"Payment Failed":(isDeposit?"Hold Dates — Deposit":"Secure Checkout")}
            </div>
            {isDeposit&&<span style={{fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.12rem 0.45rem",background:"rgba(197,151,58,0.12)",color:C.gold,border:`1px solid rgba(197,151,58,0.3)`,borderRadius:"3px"}}>Deposit</span>}
            {holidayDiscount>0&&<span style={{fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.12rem 0.45rem",background:"rgba(76,175,125,0.1)",color:C.success,border:`1px solid rgba(76,175,125,0.3)`,borderRadius:"3px"}}>🎉 {holidayDiscount}% Off</span>}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.35rem",color:"#0E2B1F"}}>{listing.name}</div>
          <div style={{fontSize:"0.8rem",color:C.muted,marginTop:"0.2rem"}}>
            {fmtDate(checkIn)} → {fmtDate(checkOut)} · {nights} night{nights>1?"s":""} · {guests} guest{guests>1?"s":""}
          </div>
          {isDeposit&&step==="form"&&(
            <div style={{marginTop:"0.6rem",padding:"0.5rem 0.8rem",background:"rgba(197,151,58,0.07)",border:`1px solid rgba(197,151,58,0.22)`,borderRadius:"4px",fontSize:"0.74rem",color:C.mutedLight,lineHeight:1.6}}>
              Paying <strong style={{color:C.gold}}>KES {fmt(total)}</strong> deposit now · Balance of <strong style={{color:C.gold}}>KES {fmt(balanceDue)}</strong> due at check-in
            </div>
          )}
        </div>

        {/* ── FORM ── */}
        {step==="form"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            {/* Price breakdown with discount */}
            <div style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.9rem 1.1rem",marginBottom:"1.2rem"}}>
              {[
                ["Nightly rate",`KES ${fmt(listing.pricePerNight)} × ${nights}`],
                ["Cleaning fee",`KES ${fmt(listing.cleaningFee)}`],
                ...(holidayDiscount>0?[["Holiday discount",`− KES ${fmt(discountSaving)}`]]:[]),
                ...(isDeposit?[["Deposit now",`KES ${fmt(total)}`],[`Balance at check-in`,`KES ${fmt(balanceDue)}`]]:[["Total",`KES ${fmt(discountedTotal)}`]]),
              ].map(([l,r],i,arr)=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",padding:"0.3rem 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",fontWeight:i===arr.length-1?700:400}}>
                  <span style={{color:l==="Holiday discount"?C.success:C.muted}}>{l}</span>
                  <span style={{color:l==="Holiday discount"?C.success:l.includes("Total")||l.includes("Deposit")||l.includes("Balance")?C.gold:C.cream}}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:"0.2rem"}}>
              {[{lbl:"Full Name",ph:"Jane Mwangi",val:name,set:setName,type:"text"},{lbl:"M-Pesa Phone",ph:"0712 345 678",val:phone,set:setPhone,type:"tel"}].map(f=>(
                <div key={f.lbl} style={{marginBottom:"0.9rem"}}>
                  <label style={{display:"block",fontSize:"0.65rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.4rem"}}>{f.lbl}</label>
                  <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                    style={{width:"100%",background:"#FDFAF5",border:`1px solid ${C.border}`,borderRadius:"4px",padding:"0.8rem 1rem",color:"#1C1C1C",fontSize:"0.9rem",outline:"none",transition:"border-color 0.2s"}}
                    onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              ))}
              {err&&<div style={{fontSize:"0.78rem",color:C.error,marginBottom:"0.8rem",padding:"0.5rem 0.8rem",background:"rgba(224,82,82,0.08)",borderRadius:"4px",border:"1px solid rgba(224,82,82,0.2)"}}>{err}</div>}
              <button onClick={submit} style={{width:"100%",padding:"1rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s",marginTop:"0.3rem"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
                Pay KES {fmt(total)} via M-Pesa →
              </button>
              <p style={{textAlign:"center",fontSize:"0.7rem",color:C.muted,marginTop:"0.7rem"}}>🔒 Secured via PayHero · Lipa Na M-Pesa</p>
            </div>
          </div>
        )}

        {/* ── SENDING STK ── */}
        {step==="sending"&&(
          <div style={{textAlign:"center",padding:"2rem 0",animation:"fadeIn 0.3s ease"}}>
            <div style={{width:"50px",height:"50px",border:`3px solid ${C.goldDim}`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 1.5rem"}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"0.5rem"}}>
              {name?`Sending to ${name.split(" ")[0]}…`:"Sending STK push…"}
            </div>
            <div style={{fontSize:"0.82rem",color:C.muted,lineHeight:1.7}}>
              Connecting to M-Pesa for <strong style={{color:C.gold}}>+{normalisePhone(phone)}</strong><br/>Please wait…
            </div>
          </div>
        )}

        {/* ── WAITING FOR PIN ── */}
        {step==="waitPin"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"3rem",marginBottom:"0.6rem",animation:"heartBeat 1.8s ease infinite"}}>📱</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#0E2B1F",marginBottom:"0.5rem"}}>Check Your Phone Now</div>
              <div style={{fontSize:"0.85rem",color:C.muted,lineHeight:1.7}}>
                M-Pesa STK push sent to<br/>
                <strong style={{color:C.gold,fontSize:"1rem"}}>+{normalisePhone(phone)}</strong>
              </div>
            </div>
            <div style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1rem 1.2rem",marginBottom:"1.2rem"}}>
              {[
                ["Listing",listing.name],
                ["Dates",`${fmtDate(checkIn)} – ${fmtDate(checkOut)}`],
                ["Nights",`${nights} night${nights>1?"s":""}`],
                ...(holidayDiscount>0?[["Holiday discount",`${holidayDiscount}% off (−KES ${fmt(discountSaving)})`]]:[]),
                [isDeposit?"Deposit":"Amount",`KES ${fmt(total)}`],
                ["Reference",bookingRef],
              ].map(([l,r])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",padding:"0.3rem 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:l==="Holiday discount"?C.success:C.muted}}>{l}</span>
                  <span style={{color:l==="Amount"||l==="Deposit"||l==="Reference"?C.gold:l==="Holiday discount"?C.success:"#1C1C1C",fontWeight:l==="Amount"||l==="Deposit"?600:400}}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.9rem 1rem",background:"rgba(197,151,58,0.07)",border:`1px solid rgba(197,151,58,0.25)`,borderRadius:"6px",marginBottom:"1rem"}}>
              <div style={{width:"12px",height:"12px",borderRadius:"50%",border:`2px solid ${C.goldDim}`,borderTop:`2px solid ${C.gold}`,animation:"spin 0.9s linear infinite",flexShrink:0}}/>
              <div style={{fontSize:"0.78rem",color:C.mutedLight,lineHeight:1.5}}>
                <strong style={{color:C.gold}}>Enter your M-Pesa PIN</strong> on your phone to confirm the payment. This will verify automatically.
              </div>
            </div>
            <p style={{textAlign:"center",fontSize:"0.68rem",color:C.muted}}>
              Didn't get the prompt? <button onClick={()=>{setStep("form");setErr("");}} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontSize:"0.68rem",textDecoration:"underline"}}>Try again</button>
            </p>
          </div>
        )}

        {/* ── POLLING / VERIFYING ── */}
        {step==="polling"&&(
          <div style={{textAlign:"center",padding:"2.5rem 1rem",animation:"fadeIn 0.3s ease"}}>
            <div style={{width:"56px",height:"56px",border:`3px solid ${C.goldDim}`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 1.5rem"}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"0.5rem"}}>Verifying Payment…</div>
            <div style={{fontSize:"0.82rem",color:C.muted,marginBottom:"0.3rem"}}>{statusMsg}</div>
            <div style={{fontSize:"0.7rem",color:C.muted,opacity:0.7}}>Ref: {bookingRef}</div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step==="success"&&(
          <div style={{animation:"fadeIn 0.4s ease"}}>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{width:"56px",height:"56px",background:C.successDim,border:`2px solid ${C.success}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",margin:"0 auto 1rem"}}>✓</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",color:"#0E2B1F",marginBottom:"0.4rem"}}>{isDeposit?"Dates Held!":"Booking Confirmed!"}</div>
              <div style={{fontSize:"0.83rem",color:C.muted}}>{isDeposit?"Deposit received · Dates are reserved":"Payment received · M-Pesa confirmation sent"}</div>
            </div>
            <div style={{background:C.successDim,border:`1px solid rgba(76,175,125,0.25)`,borderRadius:"8px",padding:"1.2rem",marginBottom:isDeposit||holidayDiscount?"0.6rem":"1.2rem"}}>
              {[
                ["Guest",name],["Property",listing.name],
                ["Check-in",fmtDate(checkIn)],["Check-out",fmtDate(checkOut)],
                ["Nights",`${nights}`],["Guests",`${guests}`],
                ...(holidayDiscount>0?[["Holiday Saving",`KES ${fmt(discountSaving)} (${holidayDiscount}% off)`]]:[]),
                [isDeposit?"Deposit Paid":"Total Paid",`KES ${fmt(total)}`],
                ["Booking Ref",bookingRef],
              ].map(([l,r])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",padding:"0.3rem 0",borderBottom:`1px solid rgba(76,175,125,0.15)`}}>
                  <span style={{color:C.muted}}>{l}</span>
                  <span style={{color:l.includes("Paid")||l==="Booking Ref"?C.success:l==="Holiday Saving"?"#4CAF7D":C.cream,fontWeight:l.includes("Paid")||l==="Booking Ref"?600:400}}>{r}</span>
                </div>
              ))}
            </div>
            {isDeposit&&<div style={{padding:"0.7rem 1rem",background:"rgba(197,151,58,0.07)",border:`1px solid rgba(197,151,58,0.22)`,borderRadius:"6px",marginBottom:"1rem",fontSize:"0.75rem",color:C.mutedLight}}>
              💰 Balance due at check-in: <strong style={{color:C.gold}}>KES {fmt(balanceDue)}</strong>
            </div>}
            <button onClick={handleSuccess} style={{width:"100%",padding:"0.9rem",background:C.success,color:"#fff",border:"none",borderRadius:"6px",fontSize:"0.82rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
              Done — View My Booking
            </button>
          </div>
        )}

        {/* ── FAILED ── */}
        {step==="failed"&&(
          <div style={{textAlign:"center",animation:"fadeIn 0.3s ease"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"0.8rem"}}>⚠️</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#0E2B1F",marginBottom:"0.5rem"}}>Payment Unsuccessful</div>
            <div style={{fontSize:"0.83rem",color:C.muted,lineHeight:1.7,marginBottom:"1.5rem"}}>The transaction was not completed. Please check your M-Pesa balance and try again, or contact us on WhatsApp.</div>
            <div style={{display:"flex",gap:"0.8rem"}}>
              <button onClick={()=>setStep("form")} style={{flex:1,padding:"0.9rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontSize:"0.8rem",fontWeight:600,cursor:"pointer"}}>Try Again</button>
              <a href="https://wa.me/254745802200" target="_blank" rel="noreferrer" style={{flex:1,padding:"0.9rem",background:"transparent",color:C.success,border:`1px solid ${C.success}`,borderRadius:"6px",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.3rem"}}>WhatsApp</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOOKING WIDGET ───────────────────────────────────────────────
function BookingWidget({ listing, onBookingMade, activeHoliday }) {
  const [checkIn,setCheckIn]=useState(null);
  const [checkOut,setCheckOut]=useState(null);
  const [guests,setGuests]=useState(1);
  const [showCal,setShowCal]=useState(false);
  const [showModal,setShowModal]=useState(false);
  // Deposit state
  const [showDeposit,setShowDeposit]=useState(false);
  const [depositAmt,setDepositAmt]=useState("");
  const [depositErr,setDepositErr]=useState("");
  const [showDepositModal,setShowDepositModal]=useState(false);

  const nights=nightsBetween(checkIn,checkOut);
  const handleSelect=({checkIn:ci,checkOut:co})=>{ setCheckIn(ci); setCheckOut(co); };
  const handleBookingSuccess=(booking)=>onBookingMade(booking);
  const canBook=checkIn&&checkOut&&nights>0;

  const baseTotal = canBook ? nights*listing.pricePerNight+listing.cleaningFee : 0;
  const holidayDiscount = activeHoliday?.discount || 0;
  const discountedTotal = holidayDiscount ? Math.round(baseTotal*(1-holidayDiscount/100)) : baseTotal;
  const discountSaving  = baseTotal - discountedTotal;

  const openDeposit=()=>{
    if(!canBook){ setShowCal(true); return; }
    setShowDeposit(s=>!s); setDepositErr("");
  };

  const submitDeposit=()=>{
    const v=parseInt(depositAmt.replace(/,/g,""),10);
    if(!depositAmt||isNaN(v)||v<500){ setDepositErr("Minimum deposit is KES 500."); return; }
    if(v>=discountedTotal){ setDepositErr(`Enter an amount less than KES ${fmt(discountedTotal)} (the full total). Use "Reserve" above to pay in full.`); return; }
    setDepositErr(""); setShowDepositModal(true);
  };

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 16px 60px rgba(14,43,31,0.12)",position:"sticky",top:"92px"}}>

      {/* Holiday discount banner */}
      {activeHoliday&&(
        <div style={{marginBottom:"1rem",padding:"0.65rem 0.9rem",background:`linear-gradient(135deg,${activeHoliday.theme?.bg||"#0E2B1F"},rgba(14,43,31,0.95))`,borderRadius:"6px",border:`1px solid ${activeHoliday.theme?.accent||C.gold}44`,display:"flex",alignItems:"center",gap:"0.7rem"}}>
          <span style={{fontSize:"1.2rem"}}>{activeHoliday.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,color:activeHoliday.theme?.accent||C.gold,letterSpacing:"0.05em"}}>{activeHoliday.name} — {holidayDiscount}% Off</div>
            {canBook&&discountSaving>0&&<div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.6)",marginTop:"0.1rem"}}>You save KES {fmt(discountSaving)} on this booking</div>}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",color:activeHoliday.theme?.accent||C.gold,fontWeight:700,flexShrink:0}}>{holidayDiscount}%</div>
        </div>
      )}

      {/* Price */}
      <div style={{marginBottom:"1.2rem",display:"flex",alignItems:"baseline",gap:"0.4rem",flexWrap:"wrap"}}>
        {holidayDiscount>0&&canBook
          ? <>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",color:C.muted,textDecoration:"line-through"}}>KES {fmt(listing.pricePerNight)}</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:C.gold}}>KES {fmt(Math.round(listing.pricePerNight*(1-holidayDiscount/100)))}</span>
              <span style={{fontSize:"0.8rem",color:C.muted}}>/night</span>
            </>
          : <>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:C.gold}}>KES {fmt(listing.pricePerNight)}</span>
              <span style={{fontSize:"0.8rem",color:C.muted}}>/night</span>
            </>
        }
        <span style={{marginLeft:"auto",fontSize:"0.8rem",color:C.mutedLight}}>★ {listing.rating} ({listing.reviewCount})</span>
      </div>

      {/* Date display pills */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"0.8rem"}}>
        {[{label:"Check-in",val:checkIn},{label:"Check-out",val:checkOut}].map(f=>(
          <button key={f.label} onClick={()=>setShowCal(true)} style={{padding:"0.7rem 0.8rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"5px",textAlign:"left",cursor:"pointer",transition:"border-color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.2rem"}}>{f.label}</div>
            <div style={{fontSize:"0.85rem",color:f.val?C.cream:C.muted}}>{f.val?fmtDate(f.val):"Add date"}</div>
          </button>
        ))}
      </div>

      {/* Guests */}
      <div style={{padding:"0.7rem 0.8rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"5px",marginBottom:"0.8rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.2rem"}}>Guests</div>
          <div style={{fontSize:"0.85rem",color:"#1C1C1C"}}>{guests} guest{guests>1?"s":""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
          <button onClick={()=>setGuests(g=>Math.max(1,g-1))} style={{width:"26px",height:"26px",borderRadius:"50%",border:`1px solid ${C.border}`,background:"none",color:"#0E2B1F",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <span style={{color:"#1C1C1C",fontSize:"0.9rem",minWidth:"18px",textAlign:"center"}}>{guests}</span>
          <button onClick={()=>setGuests(g=>Math.min(listing.guests,g+1))} style={{width:"26px",height:"26px",borderRadius:"50%",border:`1px solid ${C.border}`,background:"none",color:"#0E2B1F",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
      </div>

      {/* Calendar toggle */}
      <button onClick={()=>setShowCal(s=>!s)} style={{width:"100%",padding:"0.6rem",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:"5px",color:C.muted,fontSize:"0.75rem",cursor:"pointer",marginBottom:"0.8rem",letterSpacing:"0.1em",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.muted;}}>
        {showCal?"▲ Hide Calendar":"▦ Open Availability Calendar"}
      </button>

      {/* Inline Calendar */}
      {showCal&&(
        <div style={{marginBottom:"0.8rem",animation:"fadeIn 0.25s ease"}}>
          <AvailCalendar bookedDates={listing.bookedDates} checkIn={checkIn} checkOut={checkOut} onSelect={handleSelect}/>
          {checkIn&&checkOut&&(
            <button onClick={()=>setShowCal(false)} style={{width:"100%",marginTop:"0.5rem",padding:"0.5rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"4px",color:C.gold,fontSize:"0.75rem",cursor:"pointer",letterSpacing:"0.1em"}}>✓ Dates Selected — Close Calendar</button>
          )}
        </div>
      )}

      {/* Price breakdown */}
      {canBook&&(
        <div style={{marginBottom:"0.8rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.8rem 1rem"}}>
          {[
            [`${nights} night${nights>1?"s":""} × KES ${fmt(listing.pricePerNight)}`,`KES ${fmt(nights*listing.pricePerNight)}`],
            ["Cleaning fee",`KES ${fmt(listing.cleaningFee)}`],
            ...(holidayDiscount>0?[[`${activeHoliday.name} discount (${holidayDiscount}%)`,`− KES ${fmt(discountSaving)}`]]:[]),
          ].map(([l,r])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.79rem",padding:"0.25rem 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:l.includes("discount")?C.success:C.muted}}>{l}</span>
              <span style={{color:l.includes("discount")?C.success:C.cream}}>{r}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",paddingTop:"0.5rem",fontWeight:700}}>
            <span style={{color:"#0E2B1F"}}>Total</span>
            <span style={{color:C.gold}}>KES {fmt(discountedTotal)}</span>
          </div>
        </div>
      )}

      {/* ── MAIN CTA ── */}
      <button onClick={()=>{ if(canBook) setShowModal(true); else setShowCal(true); }}
        style={{width:"100%",padding:"1.1rem",background:canBook?C.gold:"rgba(212,175,95,0.3)",color:canBook?C.obsidian:"rgba(212,175,95,0.6)",border:"none",borderRadius:"6px",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",cursor:canBook?"pointer":"default",transition:"all 0.2s"}}
        onMouseEnter={e=>{ if(canBook) e.target.style.background=C.goldLight; }}
        onMouseLeave={e=>{ if(canBook) e.target.style.background=C.gold; }}>
        {canBook?`Reserve · KES ${fmt(discountedTotal)}`:"Select Dates to Reserve"}
      </button>
      <p style={{textAlign:"center",fontSize:"0.7rem",color:C.muted,marginTop:"0.6rem"}}>
        {canBook?"You won't be charged until payment is confirmed":"Free cancellation · No hidden fees"}
      </p>

      {/* ── OR DIVIDER ── */}
      <div style={{display:"flex",alignItems:"center",gap:"0.7rem",margin:"1rem 0"}}>
        <div style={{flex:1,height:"1px",background:C.border}}/>
        <span style={{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,flexShrink:0}}>or</span>
        <div style={{flex:1,height:"1px",background:C.border}}/>
      </div>

      {/* ── DEPOSIT CTA ── */}
      <button onClick={openDeposit}
        style={{width:"100%",padding:"0.95rem",background:"transparent",border:`1.5px solid ${canBook?C.gold:C.border}`,borderRadius:"6px",fontSize:"0.8rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:canBook?C.gold:C.muted,cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}
        onMouseEnter={e=>{ if(canBook) e.currentTarget.style.background=C.goldDim; }}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        🔒 Pay a Deposit to Hold Dates
      </button>
      <p style={{textAlign:"center",fontSize:"0.68rem",color:C.muted,marginTop:"0.4rem",lineHeight:1.5}}>
        {canBook?"Pay any amount now to secure your dates — balance due at check-in":"Select dates first to pay a deposit"}
      </p>

      {/* ── DEPOSIT INPUT PANEL ── */}
      {showDeposit&&canBook&&(
        <div style={{marginTop:"0.9rem",padding:"1rem 1.1rem",background:"rgba(197,151,58,0.05)",border:`1px solid ${C.border}`,borderRadius:"8px",animation:"fadeIn 0.2s ease"}}>
          <div style={{fontSize:"0.65rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.gold,marginBottom:"0.7rem",fontWeight:600}}>Custom Deposit Amount</div>
          <div style={{fontSize:"0.78rem",color:C.muted,marginBottom:"0.7rem",lineHeight:1.6}}>
            Full total is <strong style={{color:C.gold}}>KES {fmt(discountedTotal)}</strong>{holidayDiscount>0&&<span style={{color:C.success}}> (after {holidayDiscount}% holiday discount)</span>}. Enter how much you'd like to pay now — minimum KES 500.
          </div>
          <div style={{display:"flex",gap:"0.5rem",alignItems:"stretch"}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:"0.8rem",top:"50%",transform:"translateY(-50%)",fontSize:"0.75rem",color:C.muted,fontWeight:500,pointerEvents:"none"}}>KES</span>
              <input type="number" min="500" max={discountedTotal-1} value={depositAmt}
                onChange={e=>{ setDepositAmt(e.target.value); setDepositErr(""); }}
                placeholder="e.g. 5000"
                style={{width:"100%",padding:"0.75rem 0.8rem 0.75rem 2.8rem",background:"#fff",border:`1px solid ${depositErr?C.error:C.border}`,borderRadius:"5px",fontSize:"0.9rem",color:"#1C1C1C",outline:"none"}}
                onFocus={e=>e.target.style.borderColor=C.gold}
                onBlur={e=>e.target.style.borderColor=depositErr?C.error:C.border}/>
            </div>
            <button onClick={submitDeposit}
              style={{padding:"0 1.1rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:700,fontSize:"0.78rem",cursor:"pointer",flexShrink:0}}
              onMouseEnter={e=>e.target.style.background=C.goldLight}
              onMouseLeave={e=>e.target.style.background=C.gold}>Pay</button>
          </div>
          {/* Quick picks */}
          {discountedTotal>0&&(
            <div style={{display:"flex",gap:"0.4rem",marginTop:"0.6rem",flexWrap:"wrap"}}>
              {[0.25,0.5].map(pct=>{
                const suggested=Math.round(discountedTotal*pct/100)*100;
                if(suggested<500||suggested>=discountedTotal) return null;
                return (
                  <button key={pct} onClick={()=>{ setDepositAmt(String(suggested)); setDepositErr(""); }}
                    style={{padding:"0.3rem 0.7rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"3px",fontSize:"0.68rem",color:C.muted,cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}}
                    onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.muted;}}>
                    {Math.round(pct*100)}% · KES {fmt(suggested)}
                  </button>
                );
              })}
            </div>
          )}
          {depositErr&&<div style={{fontSize:"0.73rem",color:C.error,marginTop:"0.5rem",lineHeight:1.5}}>{depositErr}</div>}
        </div>
      )}

      {/* WhatsApp alternative */}
      <a href={`https://wa.me/254745802200?text=${encodeURIComponent(`Hi! I'd like to book ${listing.name} from ${checkIn||"TBD"} to ${checkOut||"TBD"} for ${guests} guest(s). Please confirm availability.`)}`}
        target="_blank" rel="noreferrer"
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginTop:"0.8rem",padding:"0.7rem",border:`1px solid rgba(76,175,125,0.3)`,borderRadius:"5px",color:"#4CAF7D",fontSize:"0.75rem",fontWeight:500,textDecoration:"none",transition:"all 0.2s"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(76,175,125,0.08)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <span>📱</span> Book via WhatsApp instead
      </a>

      {/* Full payment modal */}
      {showModal&&(
        <PaymentModal listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests}
          holidayDiscount={holidayDiscount}
          onClose={()=>setShowModal(false)} onSuccess={handleBookingSuccess}/>
      )}

      {/* Deposit payment modal */}
      {showDepositModal&&(
        <PaymentModal listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests}
          customAmount={parseInt(depositAmt.replace(/,/g,""),10)||0}
          isDeposit={true}
          holidayDiscount={holidayDiscount}
          onClose={()=>setShowDepositModal(false)}
          onSuccess={(booking)=>handleBookingSuccess({...booking,isDeposit:true,depositAmount:parseInt(depositAmt.replace(/,/g,""),10),balanceDue:discountedTotal-parseInt(depositAmt.replace(/,/g,""),10)})}
        />
      )}
    </div>
  );
}

// ─── LISTING CARD ─────────────────────────────────────────────────
function ListingCard({ listing, onClick, activeHoliday }) {
  const [imgIdx,setImgIdx]=useState(0);
  const [hov,setHov]=useState(false);
  const bs=BADGE_STYLE[listing.badge]||BADGE_STYLE["Popular"];
  const disc = activeHoliday?.discount || 0;
  const discPrice = disc ? Math.round(listing.pricePerNight*(1-disc/100)) : listing.pricePerNight;
  const t = activeHoliday?.theme;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setImgIdx(0);}}
      style={{background:C.card,border:`1px solid ${hov?(disc?t?.accent+"88":C.borderHover):C.border}`,borderRadius:"8px",overflow:"hidden",cursor:"pointer",transition:"all 0.3s ease",transform:hov?"translateY(-5px)":"translateY(0)",boxShadow:hov?"0 24px 60px rgba(14,43,31,0.18)":"0 4px 20px rgba(14,43,31,0.08)"}}>
      <div style={{position:"relative",height:"220px",overflow:"hidden"}}>
        <img src={listing.photos[imgIdx]} alt={listing.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.6s ease",transform:hov?"scale(1.06)":"scale(1)"}}/>
        {listing.photos.length>1&&(
          <div style={{position:"absolute",bottom:"0.75rem",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"4px"}}>
            {listing.photos.map((_,i)=>(
              <div key={i} onMouseEnter={e=>{e.stopPropagation();setImgIdx(i);}} style={{width:i===imgIdx?"18px":"6px",height:"6px",borderRadius:"3px",background:i===imgIdx?C.gold:"rgba(255,255,255,0.6)",transition:"all 0.3s ease",cursor:"pointer"}}/>
            ))}
          </div>
        )}
        <div style={{position:"absolute",top:"0.9rem",left:"0.9rem",...bs,padding:"0.25rem 0.7rem",borderRadius:"3px",fontSize:"0.65rem",fontWeight:600}}>{listing.badge}</div>
        {/* Holiday discount flash badge */}
        {disc>0&&(
          <div style={{position:"absolute",bottom:"0.9rem",left:"0.9rem",background:`linear-gradient(135deg,${t?.accent||C.gold},${t?.accent2||C.goldLight})`,color:"#000",padding:"0.28rem 0.65rem",borderRadius:"3px",fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.05em",animation:"glowPulse 2s ease infinite",boxShadow:`0 2px 12px ${t?.accent||C.gold}66`}}>
            {activeHoliday.emoji} {disc}% OFF
          </div>
        )}
        <div style={{position:"absolute",top:"0.9rem",right:"0.9rem",background:"rgba(14,43,31,0.72)",backdropFilter:"blur(8px)",borderRadius:"3px",padding:"0.25rem 0.6rem",fontSize:"0.62rem",color:listing.available?"#5EB578":C.error,fontWeight:600,display:"flex",alignItems:"center",gap:"0.3rem"}}>
          <span style={{width:"5px",height:"5px",borderRadius:"50%",background:listing.available?"#5EB578":C.error,display:"inline-block"}}/>
          {listing.available?"Available":"Booked"}
        </div>
      </div>
      <div style={{padding:"1.3rem"}}>
        {/* Holiday banner inside card */}
        {disc>0&&(
          <div style={{marginBottom:"0.8rem",padding:"0.5rem 0.7rem",background:`linear-gradient(135deg,${t?.bg||"#0E2B1F"},rgba(14,43,31,0.9))`,borderRadius:"5px",border:`1px solid ${t?.accent||C.gold}33`,display:"flex",alignItems:"center",gap:"0.6rem"}}>
            <span style={{fontSize:"0.9rem"}}>{activeHoliday.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"0.65rem",fontWeight:700,color:t?.accent||C.gold,letterSpacing:"0.05em"}}>{activeHoliday.name} Deal — {disc}% Off</div>
              <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.5)",marginTop:"0.05rem"}}>Discount applied automatically at checkout</div>
            </div>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.4rem"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",fontWeight:500,lineHeight:1.2,flex:1}}>{listing.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:"0.25rem",flexShrink:0,marginLeft:"0.8rem"}}>
            <span style={{color:C.gold,fontSize:"0.8rem"}}>★</span>
            <span style={{fontSize:"0.8rem",color:"#1C1C1C",fontWeight:500}}>{listing.rating}</span>
            <span style={{fontSize:"0.72rem",color:C.muted}}>({listing.reviewCount})</span>
          </div>
        </div>
        <div style={{fontSize:"0.78rem",color:C.muted,marginBottom:"0.9rem"}}>{listing.neighborhood} · {listing.type}</div>
        <div style={{display:"flex",gap:"1.2rem",marginBottom:"1rem"}}>
          {[{icon:"🛏",v:`${listing.bedrooms} bed`},{icon:"🚿",v:`${listing.bathrooms} bath`},{icon:"👤",v:`${listing.guests} guests`}].map(m=>(
            <div key={m.v} style={{display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.75rem",color:C.mutedLight}}>
              <span style={{fontSize:"0.85rem"}}>{m.icon}</span>{m.v}
            </div>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"0.1rem"}}>
            {disc>0&&<span style={{fontSize:"0.72rem",color:C.muted,textDecoration:"line-through"}}>KES {fmt(listing.pricePerNight)}</span>}
            <div>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.25rem",color:disc>0?(t?.accent||C.gold):C.gold,fontWeight:500}}>KES {fmt(discPrice)}</span>
              <span style={{fontSize:"0.73rem",color:C.muted}}> /night</span>
            </div>
          </div>
          <div style={{fontSize:"0.72rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.gold}}>View →</div>
        </div>
      </div>
    </div>
  );
}

// ─── LISTING PAGE ─────────────────────────────────────────────────

// ─── INTERACTIVE LOCATION MAP ─────────────────────────────────────
// Uses Leaflet.js loaded dynamically — no API key needed.

function useLeaflet() {
  const [L, setL] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const resolve = () => { if (!cancelled && window.L) setL(window.L); };

    if (window.L) { resolve(); return; }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById("leaflet-js");
    if (existing) {
      // Script already injected — poll until window.L appears
      const iv = setInterval(() => { if (window.L) { clearInterval(iv); resolve(); } }, 80);
      return () => { cancelled = true; clearInterval(iv); };
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = resolve;
    script.onerror = () => console.warn("Leaflet failed to load");
    document.head.appendChild(script);

    return () => { cancelled = true; };
  }, []);
  return L;
}

function ListingMap({ lat, lng, name, neighborhood }) {
  const L = useLeaflet();
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const timerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!L || !mapRef.current) return;
    if (instanceRef.current) return; // already mounted

    timerRef.current = setTimeout(() => {
      if (!mapRef.current) return; // unmounted during delay
      try {
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const icon = L.divIcon({
          className: "",
          html: '<div style="background:linear-gradient(135deg,#C5973A,#D4AF37);color:#0E2B1F;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(197,151,58,0.5);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">🏠</span></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -40],
        });

        L.marker([lat, lng], { icon }).addTo(map)
          .bindPopup(
            '<div style="font-family:serif;min-width:140px;text-align:center;padding:4px 0;">' +
            '<div style="font-size:0.95rem;font-weight:600;color:#0E2B1F;margin-bottom:2px;">' + name + '</div>' +
            '<div style="font-size:0.72rem;color:#888;">' + neighborhood + ', Nairobi</div></div>',
            { maxWidth: 200 }
          ).openPopup();

        instanceRef.current = map;
        setReady(true);
      } catch(e) {
        console.warn("Map init error:", e);
      }
    }, 120);

    return () => {
      clearTimeout(timerRef.current);
      if (instanceRef.current) {
        try { instanceRef.current.remove(); } catch(_) {}
        instanceRef.current = null;
      }
    };
  }, [L]);

  return (
    <div style={{position:"relative",borderRadius:"10px",overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 4px 20px rgba(14,43,31,0.08)"}}>
      {!ready && (
        <div style={{height:"380px",background:"#F7F2EA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.8rem"}}>
          <div style={{width:"36px",height:"36px",border:`3px solid rgba(197,151,58,0.2)`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
          <div style={{fontSize:"0.78rem",color:C.muted}}>Loading map…</div>
        </div>
      )}
      <div ref={mapRef} style={{height:"380px",width:"100%",visibility:ready?"visible":"hidden"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"28px",pointerEvents:"none",background:"linear-gradient(to top,rgba(253,250,245,0.7),transparent)"}}/>
    </div>
  );
}

// Admin: location picker — click on map to set pin
function LocationPicker({ lat, lng, onChange }) {
  const L = useLeaflet();
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);
  const timerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initLat = lat || -1.2921;
  const initLng = lng || 36.8219;
  const [localLat, setLocalLat] = useState(initLat);
  const [localLng, setLocalLng] = useState(initLng);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!L || !mapRef.current) return;
    if (instanceRef.current) return;

    timerRef.current = setTimeout(() => {
      if (!mapRef.current) return;
      try {
        const map = L.map(mapRef.current, {
          center: [localLat, localLng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const markerIcon = L.divIcon({
          className: "",
          html: '<div style="background:linear-gradient(135deg,#C5973A,#D4AF37);color:#0E2B1F;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(197,151,58,0.5);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">📍</span></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([localLat, localLng], { icon: markerIcon, draggable: true }).addTo(map);
        markerRef.current = marker;

        const updatePos = (la, lo) => {
          const rLat = Math.round(la * 1e6) / 1e6;
          const rLng = Math.round(lo * 1e6) / 1e6;
          setLocalLat(rLat);
          setLocalLng(rLng);
          onChangeRef.current({ lat: rLat, lng: rLng });
        };

        marker.on("dragend", e => {
          const pos = e.target.getLatLng();
          updatePos(pos.lat, pos.lng);
        });

        map.on("click", e => {
          marker.setLatLng(e.latlng);
          updatePos(e.latlng.lat, e.latlng.lng);
        });

        instanceRef.current = map;
        setReady(true);
      } catch(e) {
        console.warn("LocationPicker init error:", e);
      }
    }, 150);

    return () => {
      clearTimeout(timerRef.current);
      if (instanceRef.current) {
        try { instanceRef.current.remove(); } catch(_) {}
        instanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [L]);

  const setCoord = (field, rawVal) => {
    const v = parseFloat(rawVal);
    if (isNaN(v)) return;
    const newLat = field === "lat" ? v : localLat;
    const newLng = field === "lng" ? v : localLng;
    if (field === "lat") setLocalLat(v);
    else setLocalLng(v);
    onChangeRef.current({ lat: newLat, lng: newLng });
    if (markerRef.current && instanceRef.current) {
      try {
        markerRef.current.setLatLng([newLat, newLng]);
        instanceRef.current.setView([newLat, newLng]);
      } catch(_) {}
    }
  };

  return (
    <div>
      <div style={{position:"relative",borderRadius:"8px",overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:"0.8rem"}}>
        {!ready && (
          <div style={{height:"320px",background:"#F7F2EA",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.6rem"}}>
            <div style={{width:"28px",height:"28px",border:`2px solid rgba(197,151,58,0.2)`,borderTop:`2px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
            <span style={{fontSize:"0.78rem",color:C.muted}}>Loading map…</span>
          </div>
        )}
        <div ref={mapRef} style={{height:"320px",width:"100%",visibility:ready?"visible":"hidden"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.6rem",marginBottom:"0.5rem"}}>
        <div>
          <label style={{display:"block",fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.3rem"}}>Latitude</label>
          <input type="number" step="0.000001" value={localLat}
            onChange={e=>setCoord("lat", e.target.value)}
            style={{...field,fontFamily:"monospace",fontSize:"0.85rem"}} onFocus={fieldFocus} onBlur={fieldBlur}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.3rem"}}>Longitude</label>
          <input type="number" step="0.000001" value={localLng}
            onChange={e=>setCoord("lng", e.target.value)}
            style={{...field,fontFamily:"monospace",fontSize:"0.85rem"}} onFocus={fieldFocus} onBlur={fieldBlur}/>
        </div>
      </div>
      <div style={{fontSize:"0.72rem",color:C.muted,padding:"0.5rem 0.7rem",background:"rgba(197,151,58,0.06)",borderRadius:"4px",border:`1px solid rgba(197,151,58,0.2)`}}>
        💡 Click anywhere on the map or drag the pin to set the exact location. You can also paste coordinates above.
      </div>
    </div>
  );
}

function ListingPage({ listing, onBack, onNavigate, onBookingMade, activeHoliday }) {
  const [activePhoto,setActivePhoto]=useState(0);
  const [lightbox,setLightbox]=useState(false);
  const bs=BADGE_STYLE[listing.badge]||BADGE_STYLE["Popular"];
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:"#FDFAF5"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"1.5rem 1.5rem 0"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"0.8rem",letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:"0.4rem",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="rgba(247,242,234,0.6)"}>← All Listings</button>
      </div>
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"1.5rem 1.5rem 4rem"}}>
        {/* Title */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem",flexWrap:"wrap",gap:"1rem"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"0.8rem",marginBottom:"0.5rem"}}>
              <span style={{...bs,padding:"0.25rem 0.75rem",borderRadius:"3px",fontSize:"0.65rem",fontWeight:600}}>{listing.badge}</span>
              <span style={{fontSize:"0.75rem",color:C.muted}}>{listing.type} · {listing.neighborhood}, {listing.city}</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:400,color:"#0E2B1F",marginBottom:"0.3rem"}}>{listing.name}</h1>
            <div style={{fontSize:"0.9rem",color:C.muted,fontStyle:"italic"}}>{listing.tagline}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
            <span style={{color:C.gold}}>★★★★★</span>
            <span style={{color:"#1C1C1C",fontWeight:500}}>{listing.rating}</span>
            <span style={{color:C.muted,fontSize:"0.85rem"}}>({listing.reviewCount} reviews)</span>
          </div>
        </div>
        {/* Gallery */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"300px 160px",gap:"6px",borderRadius:"8px",overflow:"hidden",marginBottom:"1rem"}}>
          <div style={{gridRow:"1/3",cursor:"pointer",position:"relative"}} onClick={()=>setLightbox(true)}>
            <img src={listing.photos[activePhoto]} alt={listing.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <div style={{position:"absolute",bottom:"1rem",right:"1rem",background:"rgba(14,43,31,0.75)",backdropFilter:"blur(8px)",padding:"0.4rem 0.8rem",borderRadius:"3px",fontSize:"0.7rem",color:"#F7F2EA",letterSpacing:"0.1em"}}>
              View all {listing.photos.length} photos
            </div>
          </div>
          {listing.photos.slice(1,3).map((p,i)=>(
            <div key={i} style={{cursor:"pointer",overflow:"hidden"}} onClick={()=>{setActivePhoto(i+1);setLightbox(true);}}>
              <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s"}} onMouseEnter={e=>e.target.style.transform="scale(1.04)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
            </div>
          ))}
        </div>
        {/* Thumbnails */}
        <div style={{display:"flex",gap:"8px",marginBottom:"3rem",overflowX:"auto",paddingBottom:"4px"}}>
          {listing.photos.map((p,i)=>(
            <div key={i} onClick={()=>setActivePhoto(i)} style={{width:"70px",height:"50px",borderRadius:"4px",overflow:"hidden",cursor:"pointer",border:`2px solid ${i===activePhoto?C.gold:"transparent"}`,background:"#F7F2EA",transition:"border-color 0.2s",flexShrink:0}}>
              <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
          ))}
        </div>
        {/* Content + Widget */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:"4rem",alignItems:"start"}}>
          <div>
            {/* Meta */}
            <div style={{display:"flex",gap:"2rem",paddingBottom:"2rem",borderBottom:`1px solid ${C.border}`,marginBottom:"2rem",flexWrap:"wrap",background:"transparent"}}>
              {[{icon:"🛏",l:`${listing.bedrooms} Bedroom${listing.bedrooms>1?"s":""}`},{icon:"🚿",l:`${listing.bathrooms} Bathroom${listing.bathrooms>1?"s":""}`},{icon:"👤",l:`Up to ${listing.guests} Guests`},{icon:"㎡",l:`${listing.sqm} sqm`}].map(m=>(
                <div key={m.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:"1.3rem",marginBottom:"0.3rem"}}>{m.icon}</div>
                  <div style={{fontSize:"0.78rem",color:C.mutedLight}}>{m.l}</div>
                </div>
              ))}
            </div>
            {/* Description */}
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:"#0E2B1F",marginBottom:"1rem",fontWeight:400}}>About this space</h2>
            {listing.description.split("\n\n").map((p,i)=>(
              <p key={i} style={{fontSize:"0.92rem",color:C.mutedLight,lineHeight:1.85,marginBottom:"1rem",fontWeight:300}}>{p}</p>
            ))}
            {/* Amenities */}
            <div style={{marginTop:"2.5rem"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:400}}>What's included</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0.6rem"}}>
                {listing.amenities.map(a=>(
                  <div key={a} style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.7rem 1rem",background:"#F7F2EA",borderRadius:"4px",border:`1px solid ${C.border}`}}>
                    <span style={{color:C.gold}}>✓</span>
                    <span style={{fontSize:"0.83rem",color:C.mutedLight}}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Rules */}
            <div style={{marginTop:"2.5rem"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:"#0E2B1F",marginBottom:"1rem",fontWeight:400}}>House Rules</h2>
              {listing.houseRules.map(r=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.6rem 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.gold,fontSize:"0.75rem"}}>—</span>
                  <span style={{fontSize:"0.87rem",color:C.muted}}>{r}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Booking widget */}
          <BookingWidget listing={listing} onBookingMade={onBookingMade} activeHoliday={activeHoliday}/>
        </div>
      </div>

      {/* ── LOCATION ── */}
      {listing.lat && listing.lng && (
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 1.5rem 5rem"}}>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"3rem"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem",marginBottom:"1.8rem"}}>
              <div>
                <div style={{fontSize:"0.65rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.5rem"}}>Location</div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400,marginBottom:"0.3rem"}}>Where you'll be</h2>
                <div style={{fontSize:"0.9rem",color:C.muted}}>{listing.neighborhood}, {listing.city}, Kenya</div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`}
                target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.7rem 1.3rem",background:C.gold,color:C.obsidian,borderRadius:"5px",fontWeight:700,fontSize:"0.78rem",letterSpacing:"0.12em",textTransform:"uppercase",textDecoration:"none",transition:"all 0.2s",flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.background=C.goldLight}
                onMouseLeave={e=>e.currentTarget.style.background=C.gold}>
                🗺 Get Directions
              </a>
            </div>

            <ListingMap lat={listing.lat} lng={listing.lng} name={listing.name} neighborhood={listing.neighborhood}/>

            {listing.locationNote && (
              <div style={{marginTop:"1.2rem",padding:"1.1rem 1.4rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"8px",display:"flex",gap:"0.9rem",alignItems:"flex-start"}}>
                <span style={{fontSize:"1.1rem",flexShrink:0,marginTop:"0.1rem"}}>📍</span>
                <div>
                  <div style={{fontSize:"0.65rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,marginBottom:"0.3rem",fontWeight:600}}>Finding us</div>
                  <p style={{fontSize:"0.88rem",color:C.mutedLight,lineHeight:1.75,margin:0}}>{listing.locationNote}</p>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:"1rem",marginTop:"1.2rem",flexWrap:"wrap"}}>
              <a href={`https://maps.apple.com/?daddr=${listing.lat},${listing.lng}`}
                target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"4px",fontSize:"0.75rem",color:C.muted,fontWeight:500,textDecoration:"none",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                🍎 Apple Maps
              </a>
              <a href={`https://waze.com/ul?ll=${listing.lat},${listing.lng}&navigate=yes`}
                target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"4px",fontSize:"0.75rem",color:C.muted,fontWeight:500,textDecoration:"none",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                🔵 Open in Waze
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(14,43,31,0.95)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setLightbox(false)} style={{position:"absolute",top:"1.5rem",right:"1.5rem",background:"none",border:"none",color:"#F7F2EA",fontSize:"1.8rem",cursor:"pointer",opacity:0.8}}>✕</button>
          <img src={listing.photos[activePhoto]} alt="" style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain",borderRadius:"4px"}} onClick={e=>e.stopPropagation()}/>
          <div style={{position:"absolute",bottom:"2rem",display:"flex",gap:"0.5rem"}}>
            {listing.photos.map((_,i)=>(
              <button key={i} onClick={e=>{e.stopPropagation();setActivePhoto(i);}} style={{width:i===activePhoto?"22px":"7px",height:"7px",borderRadius:"4px",background:i===activePhoto?C.gold:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",transition:"all 0.3s"}}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LISTINGS PAGE ────────────────────────────────────────────────
function ListingsPage({ listings, onSelect, promoConfig, activeHoliday, onSelectWithHoliday }) {
  const [filter,setFilter]=useState("All");
  const types=["All","Studio","1-Bedroom","2+ Bedrooms","Villa"];
  const filtered=filter==="All"?listings:listings.filter(l=>
    filter==="Villa"?l.type.toLowerCase().includes("villa"):
    filter==="Studio"?l.type.toLowerCase().includes("studio"):
    filter==="1-Bedroom"?l.bedrooms===1&&!l.type.toLowerCase().includes("studio"):
    filter==="2+ Bedrooms"?l.bedrooms>=2&&!l.type.toLowerCase().includes("villa"):true
  );
  const upcomingForTicker = promoConfig ? getUpcomingHolidays(promoConfig, 6) : [];
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:"#FDFAF5"}}>
      {upcomingForTicker.length > 0 && <PromoTicker holidays={upcomingForTicker}/>}
      <div style={{background:"linear-gradient(180deg,#EEE9E0 0%,#F7F2EA 100%)",padding:"4rem 1.5rem 2rem",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Our Portfolio</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.5rem,5vw,4rem)",fontWeight:400,color:"#0E2B1F",marginBottom:"1rem"}}>
            {listings.length} Exceptional <em style={{color:C.gold,fontStyle:"italic"}}>Stays</em>
          </h1>
          <p style={{fontSize:"0.95rem",color:C.muted,maxWidth:"520px",lineHeight:1.8}}>Every listing is personally curated. Nairobi's best addresses, at your fingertips.</p>
          <div style={{display:"flex",gap:"0.6rem",marginTop:"2rem",flexWrap:"wrap"}}>
            {types.map(t=>(
              <button key={t} onClick={()=>setFilter(t)} style={{padding:"0.5rem 1.2rem",background:filter===t?C.gold:"transparent",color:filter===t?C.obsidian:C.muted,border:`1px solid ${filter===t?C.gold:C.border}`,borderRadius:"2px",cursor:"pointer",fontSize:"0.75rem",fontWeight:500,letterSpacing:"0.08em",transition:"all 0.2s"}}>{t}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"2rem 1.5rem 4rem",background:"#FDFAF5"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,320px),1fr))",gap:"1.2rem"}}>
          {filtered.map(l=>(
            <div key={l.id} style={{animation:"fadeUp 0.6s ease both"}}><ListingCard listing={l} onClick={()=>activeHoliday&&onSelectWithHoliday?onSelectWithHoliday(l,activeHoliday):onSelect(l)} activeHoliday={activeHoliday}/></div>
          ))}
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"6rem 0",color:C.muted,background:"#FDFAF5"}}>No listings match this filter.</div>}
      </div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────
function Hero({ listings, onNavigate }) {
  const [slide,setSlide]=useState(0);
  const [mobile,setMobile]=useState(window.innerWidth<768);
  const photos=listings.map(l=>l.photos[0]);

  useEffect(()=>{
    const t=setInterval(()=>setSlide(s=>(s+1)%photos.length),4500);
    const onResize=()=>setMobile(window.innerWidth<768);
    window.addEventListener("resize",onResize);
    return()=>{ clearInterval(t); window.removeEventListener("resize",onResize); };
  },[photos.length]);

  return (
    <section style={{background:"#0E2B1F",paddingTop:"64px",overflow:"hidden",minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      {/* ── MOBILE layout: stacked ── */}
      {mobile&&(
        <>
          {/* Photo — top half on mobile */}
          <div style={{position:"relative",height:"42vh",flexShrink:0}}>
            {photos.map((src,i)=>(
              <div key={i} style={{position:"absolute",inset:0,backgroundImage:`url(${src})`,backgroundSize:"cover",backgroundPosition:"center",opacity:i===slide?1:0,transition:"opacity 1.4s ease"}}/>
            ))}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(14,43,31,0.15) 0%, rgba(14,43,31,0.45) 100%)"}}/>
            {/* Slide dots */}
            <div style={{position:"absolute",bottom:"1rem",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"5px"}}>
              {photos.map((_,i)=>(
                <button key={i} onClick={()=>setSlide(i)} style={{width:i===slide?"20px":"6px",height:"6px",borderRadius:"3px",background:i===slide?C.gold:"rgba(253,250,245,0.5)",border:"none",cursor:"pointer",transition:"all 0.4s ease"}}/>
              ))}
            </div>
          </div>

          {/* Text — below photo on mobile */}
          <div style={{flex:1,padding:"2rem 1.5rem 2.5rem",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"-60px",right:"-60px",width:"200px",height:"200px",borderRadius:"50%",background:"rgba(197,151,58,0.07)",pointerEvents:"none"}}/>

            <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:"rgba(197,151,58,0.15)",border:"1px solid rgba(197,151,58,0.3)",borderRadius:"20px",padding:"0.3rem 0.8rem",marginBottom:"1.2rem",alignSelf:"flex-start"}}>
              <span style={{width:"5px",height:"5px",borderRadius:"50%",background:C.gold,display:"inline-block"}}/>
              <span style={{fontSize:"0.6rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold}}>Nairobi's Premier Short Stays</span>
            </div>

            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"2.8rem",fontWeight:400,lineHeight:1.05,color:"#F7F2EA",marginBottom:"1rem",animation:"fadeUp 0.6s ease both"}}>
              Live Like a<br/><em style={{color:C.gold,fontStyle:"italic"}}>Local Legend</em>
            </h1>

            <p style={{fontSize:"0.95rem",color:"rgba(247,242,234,0.7)",lineHeight:1.75,fontWeight:300,marginBottom:"1.8rem",maxWidth:"360px"}}>
              Handpicked apartments, studios and villas across Nairobi's finest neighbourhoods.
            </p>

            <div style={{display:"flex",gap:"0.7rem",flexWrap:"wrap",marginBottom:"2rem"}}>
              <button onClick={()=>onNavigate("listings")} style={{background:C.gold,color:"#0E2B1F",padding:"0.9rem 1.8rem",fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",border:"none",borderRadius:"4px",cursor:"pointer",boxShadow:"0 4px 16px rgba(197,151,58,0.4)"}}>
                Explore Stays
              </button>
              <button onClick={()=>onNavigate("about")} style={{background:"transparent",color:"#F7F2EA",padding:"0.9rem 1.4rem",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",border:"1px solid rgba(247,242,234,0.3)",borderRadius:"4px",cursor:"pointer"}}>
                Our Story
              </button>
            </div>

            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0",paddingTop:"1.2rem",borderTop:"1px solid rgba(247,242,234,0.1)"}}>
              {[{n:"6",l:"Listings"},{n:"4.95",l:"Rating"},{n:"440+",l:"Guests"},{n:"5",l:"Areas"}].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:C.gold,fontWeight:500}}>{s.n}</div>
                  <div style={{fontSize:"0.55rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(247,242,234,0.4)",marginTop:"0.15rem"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── DESKTOP layout: side-by-side ── */}
      {!mobile&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",flex:1,minHeight:"calc(100vh - 64px)"}}>
          {/* LEFT — text */}
          <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"5rem 4rem 5rem 6rem",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:"-80px",left:"-80px",width:"320px",height:"320px",borderRadius:"50%",background:"rgba(197,151,58,0.07)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",bottom:"-40px",right:"-60px",width:"200px",height:"200px",borderRadius:"50%",background:"rgba(197,151,58,0.05)",pointerEvents:"none"}}/>

            <div style={{position:"relative",zIndex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"rgba(197,151,58,0.15)",border:"1px solid rgba(197,151,58,0.3)",borderRadius:"20px",padding:"0.35rem 1rem",marginBottom:"2rem"}}>
                <span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.gold,display:"inline-block",animation:"pulse 2s ease infinite"}}/>
                <span style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold}}>Nairobi's Premier Short Stays</span>
              </div>

              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(3rem,4vw,5.5rem)",fontWeight:400,lineHeight:1.05,color:"#F7F2EA",marginBottom:"1.6rem",animation:"fadeUp 0.8s ease both"}}>
                Live Like a<br/><em style={{color:C.gold,fontStyle:"italic"}}>Local Legend</em>
              </h1>

              <p style={{fontSize:"1rem",color:"rgba(247,242,234,0.7)",maxWidth:"420px",lineHeight:1.85,fontWeight:300,marginBottom:"2.8rem"}}>
                Handpicked apartments, studios and villas across Nairobi's finest neighbourhoods. One night or one year.
              </p>

              <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap",marginBottom:"3.5rem"}}>
                <button onClick={()=>onNavigate("listings")} style={{background:C.gold,color:"#0E2B1F",pad
