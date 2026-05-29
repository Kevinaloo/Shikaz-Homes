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
          <div style={{display:"flex",alignItems:"center",gap:"2rem"}}>
            {["Listings","About","Contact"].map(l=>(
              <button key={l} onClick={()=>onNavigate(l.toLowerCase())} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.75rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(247,242,234,0.75)",transition:"color 0.2s",padding:"0.25rem 0"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color="rgba(247,242,234,0.75)"}>{l}</button>
            ))}
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
          <button onClick={()=>{onNavigate("admin");setMenuOpen(false);}} style={{marginTop:"0.8rem",background:C.gold,color:"#0E2B1F",border:"none",padding:"0.85rem 1.5rem",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",borderRadius:"4px",cursor:"pointer"}}>Host Login</button>
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
function PaymentModal({ listing, checkIn, checkOut, guests, onClose, onSuccess, customAmount, isDeposit, holidayDiscount }) {
  const nights  = nightsBetween(checkIn,checkOut);
  const baseTotal = nights*listing.pricePerNight + listing.cleaningFee;
  // Apply holiday discount to base total (not to deposit — discount is on the full stay)
  const discountedTotal = holidayDiscount
    ? Math.round(baseTotal * (1 - holidayDiscount/100))
    : baseTotal;
  const discountSaving  = baseTotal - discountedTotal;
  // If paying deposit, amount is customAmount; otherwise discounted total
  const total   = (isDeposit && customAmount) ? customAmount : discountedTotal;
  const balanceDue = isDeposit ? discountedTotal - total : 0;

  const [step,setStep]=useState("form");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [err,setErr]=useState("");
  const bookingRef = useState(()=>genRef())[0];

  const validatePhone=p=>/^(?:254|0)[17]\d{8}$/.test(p.replace(/\s/g,""));
  const normalisePhone=p=>{ const c=p.replace(/\s/g,""); return c.startsWith("0")?"254"+c.slice(1):c; };

  const submit=()=>{
    if(!name.trim()){ setErr("Please enter your full name."); return; }
    if(!validatePhone(phone)){ setErr("Enter a valid Safaricom number (07xx or 254xx)."); return; }
    setErr(""); setStep("sending");
    setTimeout(()=>setStep("confirm"),2200);
  };

  const confirmPay=()=>{
    setStep("sending");
    setTimeout(()=>setStep(Math.random()>0.1?"success":"failed"),3500);
  };

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
              {name?`Processing, ${name.split(" ")[0]}…`:"Processing…"}
            </div>
            <div style={{fontSize:"0.82rem",color:C.muted,lineHeight:1.7}}>
              Sending STK push to <strong style={{color:C.gold}}>+{normalisePhone(phone)}</strong><br/>Please wait…
            </div>
          </div>
        )}

        {/* ── CONFIRM PIN ── */}
        {step==="confirm"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"2.5rem",marginBottom:"0.7rem"}}>📱</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#0E2B1F",marginBottom:"0.5rem"}}>Check Your Phone</div>
              <div style={{fontSize:"0.85rem",color:C.muted,lineHeight:1.7}}>
                An M-Pesa STK push has been sent to<br/>
                <strong style={{color:C.gold}}>+{normalisePhone(phone)}</strong>
              </div>
            </div>
            <div style={{background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"1rem 1.2rem",marginBottom:"1.2rem"}}>
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
                  <span style={{color:l==="Amount"||l==="Deposit"||l==="Reference"?C.gold:l==="Holiday discount"?C.success:C.cream,fontWeight:l==="Amount"||l==="Deposit"?600:400}}>{r}</span>
                </div>
              ))}
            </div>
            <button onClick={confirmPay} style={{width:"100%",padding:"1rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
              ✓ I've Entered My PIN
            </button>
            <p style={{textAlign:"center",fontSize:"0.7rem",color:C.muted,marginTop:"0.6rem"}}>Enter your M-Pesa PIN on your phone to complete payment</p>
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
                <button onClick={()=>onNavigate("listings")} style={{background:C.gold,color:"#0E2B1F",padding:"1rem 2.4rem",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",border:"none",borderRadius:"4px",cursor:"pointer",transition:"all 0.25s",boxShadow:"0 4px 20px rgba(197,151,58,0.4)"}}
                  onMouseEnter={e=>{e.target.style.background=C.goldLight;e.target.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.target.style.background=C.gold;e.target.style.transform="translateY(0)";}}>
                  Explore Stays
                </button>
                <button onClick={()=>onNavigate("about")} style={{background:"transparent",color:"#F7F2EA",padding:"1rem 2rem",fontSize:"0.82rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",border:"1px solid rgba(247,242,234,0.3)",borderRadius:"4px",cursor:"pointer",transition:"all 0.25s"}}
                  onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}}
                  onMouseLeave={e=>{e.target.style.borderColor="rgba(247,242,234,0.3)";e.target.style.color="#F7F2EA";}}>
                  Our Story
                </button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",paddingTop:"2rem",borderTop:"1px solid rgba(247,242,234,0.1)"}}>
                {[{n:"6",l:"Listings"},{n:"4.95",l:"Rating"},{n:"440+",l:"Guests"},{n:"5",l:"Areas"}].map(s=>(
                  <div key={s.l} style={{textAlign:"center",padding:"0 0.5rem"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:C.gold,fontWeight:500}}>{s.n}</div>
                    <div style={{fontSize:"0.6rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(247,242,234,0.45)",marginTop:"0.2rem"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — photo */}
          <div style={{position:"relative",background:"#2D4A3A",overflow:"hidden"}}>
            {photos.map((src,i)=>(
              <div key={i} style={{position:"absolute",inset:0,backgroundImage:`url(${src})`,backgroundSize:"cover",backgroundPosition:"center",opacity:i===slide?1:0,transition:"opacity 1.4s ease"}}/>
            ))}
            <div style={{position:"absolute",inset:0,background:"rgba(14,43,31,0.1)"}}/>

            {/* Listing card */}
            <div style={{position:"absolute",bottom:"2rem",left:"1.5rem",right:"1.5rem",zIndex:2}}>
              <div style={{background:"rgba(253,250,245,0.94)",backdropFilter:"blur(12px)",borderRadius:"10px",padding:"1rem 1.2rem",boxShadow:"0 8px 32px rgba(14,43,31,0.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#0E2B1F",fontWeight:500}}>{listings[slide]?.name}</div>
                    <div style={{fontSize:"0.72rem",color:C.muted,marginTop:"0.15rem"}}>{listings[slide]?.neighborhood} · from KES {fmt(listings[slide]?.pricePerNight)}/night</div>
                  </div>
                  <button onClick={()=>onNavigate("listings")} style={{background:"#0E2B1F",color:"#F7F2EA",border:"none",borderRadius:"4px",padding:"0.5rem 1rem",fontSize:"0.7rem",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",transition:"background 0.2s",flexShrink:0,marginLeft:"1rem"}}
                    onMouseEnter={e=>e.target.style.background=C.gold}
                    onMouseLeave={e=>e.target.style.background="#0E2B1F"}>
                    View →
                  </button>
                </div>
              </div>
            </div>

            {/* Slide dots */}
            <div style={{position:"absolute",top:"1.5rem",right:"1.5rem",zIndex:2,display:"flex",flexDirection:"column",gap:"6px"}}>
              {photos.map((_,i)=>(
                <button key={i} onClick={()=>setSlide(i)} style={{width:"7px",height:i===slide?"22px":"7px",borderRadius:"4px",background:i===slide?"#F7F2EA":"rgba(253,250,245,0.4)",border:"none",cursor:"pointer",transition:"all 0.4s ease"}}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── BOOKINGS PANEL ───────────────────────────────────────────────
function MyBookingsPanel({ bookings, onClose }) {
  if(!bookings.length) return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,5,10,0.9)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"2.5rem",textAlign:"center",maxWidth:"380px"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"2rem",marginBottom:"1rem"}}>📋</div>
        <div style={{fontFamily:"'Playfair Display',serif",color:"#0E2B1F",fontSize:"1.2rem",marginBottom:"0.5rem"}}>No bookings yet</div>
        <div style={{color:C.muted,fontSize:"0.85rem",marginBottom:"1.5rem"}}>Your confirmed bookings will appear here.</div>
        <button onClick={onClose} style={{background:C.gold,color:C.obsidian,border:"none",padding:"0.7rem 1.8rem",borderRadius:"4px",cursor:"pointer",fontWeight:600}}>Browse Listings</button>
      </div>
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(14,43,31,0.65)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={onClose}>
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",width:"100%",maxWidth:"600px",maxHeight:"80vh",overflowY:"auto",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{position:"sticky",top:0,background:"#fff",padding:"1.5rem 1.8rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Playfair Display',serif",color:"#0E2B1F",fontSize:"1.3rem"}}>My Bookings</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:"1.3rem",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"1.2rem"}}>
          {bookings.map((b,i)=>(
            <div key={i} style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"1.2rem",marginBottom:"0.8rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.7rem"}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",color:"#0E2B1F",fontSize:"1rem"}}>{b.listing?.name}</div>
                  <div style={{fontSize:"0.75rem",color:C.muted,marginTop:"0.2rem"}}>{fmtDate(b.checkIn)} – {fmtDate(b.checkOut)} · {b.nights} night{b.nights>1?"s":""}</div>
                </div>
                <div style={{background:C.successDim,border:"1px solid rgba(76,175,125,0.3)",borderRadius:"4px",padding:"0.2rem 0.6rem",fontSize:"0.65rem",color:C.success,fontWeight:600}}>Confirmed</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",borderTop:`1px solid ${C.border}`,paddingTop:"0.6rem"}}>
                <span style={{color:C.muted}}>Ref: <span style={{color:C.gold,fontWeight:600}}>{b.ref}</span></span>
                <span style={{color:C.gold,fontWeight:600}}>KES {fmt(b.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIMPLE PAGES ─────────────────────────────────────────────────
function AboutPage({ siteContent }) {
  const sc = siteContent || DEFAULT_SITE_CONTENT;
  const paragraphs = Array.isArray(sc.aboutParagraphs) ? sc.aboutParagraphs : DEFAULT_SITE_CONTENT.aboutParagraphs;
  const [titleWord1, ...titleRest] = sc.aboutHeroTitle.split(" ");
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:C.obsidian}}>
      <div style={{backgroundImage:`url(${sc.aboutHeroImage})`,backgroundSize:"cover",backgroundPosition:"center",height:"50vh",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"rgba(14,43,31,0.6)"}}/>
        <div style={{position:"relative",zIndex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"3rem 4rem"}}>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>{sc.aboutHeroSubtitle}</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.5rem,5vw,4rem)",color:"#F7F2EA",fontWeight:400}}>
            {sc.aboutHeroTitle.split("\n").map((line,i)=>(
              <span key={i}>{i>0&&<br/>}{line}</span>
            ))}
          </h1>
        </div>
      </div>
      <div style={{maxWidth:"800px",margin:"0 auto",padding:"3rem 1.5rem"}}>
        {paragraphs.map((p,i)=>(
          <p key={i} style={{fontSize:"1rem",color:C.mutedLight,lineHeight:1.9,marginBottom:"1.6rem",fontWeight:300}}>{p}</p>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"1rem",marginTop:"2rem"}}>
          {[{n:sc.statFounded,l:"Founded"},{n:sc.statGuests,l:"Guests hosted"},{n:sc.statRating,l:"Avg rating"}].map(s=>(
            <div key={s.l} style={{textAlign:"center",padding:"2rem",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"6px",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",color:C.gold,marginBottom:"0.4rem"}}>{s.n}</div>
              <div style={{fontSize:"0.72rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.muted}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactPage({ siteContent }) {
  const sc = siteContent || DEFAULT_SITE_CONTENT;
  const items = [
    {icon:"📱",label:"WhatsApp",val:sc.whatsappDisplay||sc.whatsapp,link:`https://wa.me/${sc.whatsapp}`},
    {icon:"✉️",label:"Email",val:sc.email,link:`mailto:${sc.email}`},
    {icon:"📞",label:"Phone",val:sc.phone,link:`tel:${sc.phone}`},
    {icon:"◎",label:"Location",val:sc.location},
    {icon:"⏰",label:"Response",val:sc.responseTime},
  ].filter(i=>i.val&&i.val.trim());
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:C.obsidian}}>
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"3rem 1.5rem",background:"#FDFAF5"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Get in Touch</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.5rem,5vw,4rem)",color:"#0E2B1F",fontWeight:400,marginBottom:"1rem"}}>Ready to <em style={{color:C.gold}}>book?</em></h1>
        <p style={{fontSize:"0.95rem",color:C.muted,marginBottom:"3rem",lineHeight:1.8}}>Reach us on WhatsApp for the fastest response, or fill in the form below.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))",gap:"1.2rem"}}>
          {items.map(c=>(
            <div key={c.label} style={{padding:"1.8rem",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"6px",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
              <div style={{fontSize:"1.6rem",marginBottom:"0.8rem"}}>{c.icon}</div>
              <div style={{fontSize:"0.68rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.muted,marginBottom:"0.3rem"}}>{c.label}</div>
              {c.link
                ? <a href={c.link} target="_blank" rel="noreferrer" style={{color:C.gold,fontSize:"0.95rem",fontWeight:500,wordBreak:"break-all"}}>{c.val}</a>
                : <div style={{color:"#1C1C1C",fontSize:"0.95rem"}}>{c.val}</div>
              }
            </div>
          ))}
        </div>
        {/* WhatsApp CTA */}
        <div style={{marginTop:"3rem",padding:"2rem",background:"linear-gradient(135deg,#0E2B1F,#1a3d2b)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",color:"#F7F2EA",marginBottom:"0.3rem"}}>Chat with us directly</div>
            <div style={{fontSize:"0.85rem",color:"rgba(247,242,234,0.6)"}}>Average response time: {sc.responseTime}</div>
          </div>
          <a href={`https://wa.me/${sc.whatsapp}?text=${encodeURIComponent("Hi! I'd like to inquire about a Shikaz Homes booking.")}`}
            target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:"0.6rem",padding:"0.9rem 1.8rem",background:"#25D366",color:"#fff",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",letterSpacing:"0.12em",textTransform:"uppercase",textDecoration:"none",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#1ebe59"}
            onMouseLeave={e=>e.currentTarget.style.background="#25D366"}>
            📱 WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// ─── HOLIDAY & PROMO ENGINE ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

// ── Kenya Public Holidays + Recurring Promos ──────────────────────
// Each entry: { id, name, emoji, month(1-12), day(1-31), daysAhead,
//   theme, palette, animStyle, defaultDiscount }
const KENYA_HOLIDAYS = [
  { id:"new_year",     name:"New Year",           emoji:"🎆", month:1,  day:1,  daysAhead:3,
    theme:"new_year",   defaultDiscount:15 },
  { id:"valentines",   name:"Valentine's Day",     emoji:"💕", month:2,  day:14, daysAhead:5,
    theme:"valentines", defaultDiscount:10 },
  { id:"good_friday",  name:"Good Friday",         emoji:"✝️", month:4,  day:7,  daysAhead:4,
    theme:"easter",     defaultDiscount:12 },
  { id:"easter",       name:"Easter Weekend",      emoji:"🐣", month:4,  day:9,  daysAhead:4,
    theme:"easter",     defaultDiscount:12 },
  { id:"labour_day",   name:"Labour Day",          emoji:"⚒️", month:5,  day:1,  daysAhead:3,
    theme:"labour",     defaultDiscount:10 },
  { id:"madaraka",     name:"Madaraka Day",        emoji:"🇰🇪", month:6,  day:1,  daysAhead:4,
    theme:"kenya",      defaultDiscount:20 },
  { id:"eid",          name:"Eid Al-Adha",         emoji:"🌙", month:6,  day:17, daysAhead:5,
    theme:"eid",        defaultDiscount:15 },
  { id:"huduma",       name:"Huduma Day",           emoji:"🤝", month:10, day:10, daysAhead:3,
    theme:"kenya",      defaultDiscount:15 },
  { id:"mashujaa",     name:"Mashujaa Day",        emoji:"🦁", month:10, day:20, daysAhead:4,
    theme:"mashujaa",   defaultDiscount:20 },
  { id:"jamhuri",      name:"Jamhuri Day",         emoji:"🇰🇪", month:12, day:12, daysAhead:5,
    theme:"kenya",      defaultDiscount:25 },
  { id:"christmas",    name:"Christmas",           emoji:"🎄", month:12, day:25, daysAhead:7,
    theme:"christmas",  defaultDiscount:15 },
  { id:"boxing_day",   name:"Boxing Day",          emoji:"🎁", month:12, day:26, daysAhead:2,
    theme:"christmas",  defaultDiscount:10 },
  { id:"new_year_eve", name:"New Year's Eve",      emoji:"🥂", month:12, day:31, daysAhead:3,
    theme:"new_year",   defaultDiscount:12 },
];

// Theme palettes for each holiday style
const HOLIDAY_THEMES = {
  new_year:   { bg:"#03020A", accent:"#FFD700", accent2:"#C0C0C0", text:"#FFD700", particles:"🎆🎇✨🥂🍾" },
  valentines: { bg:"#1a0010", accent:"#FF4D6D", accent2:"#FFB3C1", text:"#FF4D6D", particles:"💕💖💗💓💝" },
  easter:     { bg:"#0d1a00", accent:"#7EC845", accent2:"#FFE066", text:"#7EC845", particles:"🐣🌸🌷🐰🥚" },
  labour:     { bg:"#0A0A0A", accent:"#E8C870", accent2:"#FF6B35", text:"#E8C870", particles:"⚒️🔧🏗️💪✊" },
  kenya:      { bg:"#000000", accent:"#006600", accent2:"#CC0000", text:"#FFFFFF", particles:"🇰🇪🦁🌍⚡🎊" },
  eid:        { bg:"#001a0d", accent:"#C5A028", accent2:"#4CAF50", text:"#C5A028", particles:"🌙⭐🕌🌟✨" },
  mashujaa:   { bg:"#0a0000", accent:"#CC0000", accent2:"#006600", text:"#FFFFFF", particles:"🦁⚔️🛡️🌍🔥" },
  christmas:  { bg:"#001400", accent:"#FF3333", accent2:"#FFD700", text:"#FFFFFF", particles:"🎄🎅🎁❄️⛄" },
};

// Supabase load/save for promo config
async function loadPromos() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:promos").single();
    if (error || !data) return {};
    return JSON.parse(data.value);
  } catch { return {}; }
}
async function savePromos(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:promos", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}

// Find active holiday for today
function getActiveHoliday(promoConfig) {
  const now = new Date();
  const m = now.getMonth()+1;
  const d = now.getDate();
  for (const h of KENYA_HOLIDAYS) {
    // Check if we are within daysAhead window before the holiday
    const hDate = new Date(now.getFullYear(), h.month-1, h.day);
    const diffDays = Math.ceil((hDate - now) / (1000*60*60*24));
    if (diffDays >= 0 && diffDays <= h.daysAhead) {
      const cfg = promoConfig[h.id];
      if (cfg?.disabled) return null;
      const discount = cfg?.discount ?? h.defaultDiscount;
      const customMsg = cfg?.message ?? null;
      return { ...h, discount, customMsg, theme: HOLIDAY_THEMES[h.theme] || HOLIDAY_THEMES.kenya };
    }
  }
  return null;
}

// ── Particle Canvas helpers ─────────────────────────────────────────
function FloatingEmoji({ emoji, style }) {
  return (
    <div style={{
      position:"absolute", fontSize:"1.4rem", pointerEvents:"none", userSelect:"none",
      animation:`floatUp ${2+Math.random()*3}s ease-in ${Math.random()*2}s both`,
      ...style
    }}>{emoji}</div>
  );
}

function Confetti({ count=18, colors }) {
  const pieces = Array.from({length:count}, (_,i) => ({
    id:i,
    x: Math.random()*100,
    delay: Math.random()*1.5,
    dur: 1.2+Math.random()*1.5,
    color: colors[i % colors.length],
    size: 6+Math.random()*8,
    shape: Math.random()>0.5?"circle":"square",
  }));
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      {pieces.map(p=>(
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:"-20px",
          width:`${p.size}px`, height:`${p.size}px`,
          background:p.color,
          borderRadius:p.shape==="circle"?"50%":"2px",
          animation:`confettiFall ${p.dur}s ease-in ${p.delay}s both`,
          opacity:0.85,
        }}/>
      ))}
    </div>
  );
}

// ── NEW YEAR POPUP ─────────────────────────────────────────────────
function NewYearPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const [visible, setVisible] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVisible(true),80); },[]);
  const particles = t.particles.split("").filter(c=>c.trim());
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,2,10,0.92)",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(480px,92vw)",overflow:"hidden",borderRadius:"16px",
        background:`linear-gradient(160deg,${t.bg} 0%,#0d0520 100%)`,
        border:`1px solid ${t.accent}44`,
        boxShadow:`0 0 80px ${t.accent}33, 0 40px 120px rgba(0,0,0,0.8)`,
        animation:visible?"popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both":"none",
        padding:"0",
      }}>
        <Confetti count={22} colors={[t.accent,t.accent2,"#fff","#FFB3FF","#80FFFF"]}/>
        {/* Firework rings */}
        {[0,1,2].map(i=>(
          <div key={i} style={{
            position:"absolute", borderRadius:"50%",
            border:`2px solid ${i===0?t.accent:i===1?t.accent2:"#fff"}`,
            width:`${140+i*60}px`, height:`${140+i*60}px`,
            top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            animation:`firework ${1.5+i*0.3}s ease-out ${i*0.2}s infinite`,
            opacity:0.15,
          }}/>
        ))}
        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.2rem",filter:"drop-shadow(0 0 20px gold)"}}>🎆</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",color:t.accent,fontWeight:600,lineHeight:1.1,marginBottom:"0.4rem",textShadow:`0 0 30px ${t.accent}88`}}>
            Happy New Year!
          </div>
          <div style={{fontSize:"0.7rem",letterSpacing:"0.4em",textTransform:"uppercase",color:t.accent2,marginBottom:"1.2rem"}}>
            {new Date().getFullYear()} Celebrations
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>Ring in the New Year in style. Book your Nairobi stay now and celebrate with <strong style={{color:t.accent}}>{holiday.discount}% off</strong> — exclusive New Year rates.</p>
          }
          <div style={{background:`linear-gradient(135deg,${t.accent}22,${t.accent2}11)`,border:`1px solid ${t.accent}55`,borderRadius:"10px",padding:"1rem 1.5rem",marginBottom:"1.5rem",animation:"glowPulse 2s ease infinite"}}>
            <div style={{fontSize:"0.6rem",letterSpacing:"0.3em",textTransform:"uppercase",color:t.accent2,marginBottom:"0.3rem"}}>New Year Offer</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.5rem",color:t.accent,fontWeight:700}}>{holiday.discount}% OFF</div>
            <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginTop:"0.2rem"}}>Use code: <strong style={{color:t.accent2,letterSpacing:"0.1em"}}>NEWYEAR{new Date().getFullYear()}</strong></div>
          </div>
          <button onClick={onBook} style={{width:"100%",padding:"1rem",background:`linear-gradient(135deg,${t.accent},${t.accent2})`,color:"#000",border:"none",borderRadius:"8px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer",marginBottom:"0.8rem"}}>
            🥂 Claim My New Year Deal
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"0.75rem",cursor:"pointer",letterSpacing:"0.1em"}}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VALENTINES POPUP ───────────────────────────────────────────────
function ValentinesPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const [visible, setVisible] = useState(false);
  const [hearts, setHearts] = useState([]);
  useEffect(()=>{
    setTimeout(()=>setVisible(true),80);
    const h = Array.from({length:12},(_,i)=>({ id:i, x:Math.random()*100, delay:Math.random()*2, size:1+Math.random()*1.5 }));
    setHearts(h);
  },[]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(26,0,16,0.93)",backdropFilter:"blur(10px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(440px,92vw)",borderRadius:"20px",overflow:"hidden",
        background:`linear-gradient(135deg,#1a0010 0%,#2d0020 50%,#1a0010 100%)`,
        border:`2px solid ${t.accent}66`,
        boxShadow:`0 0 60px ${t.accent}44, 0 40px 100px rgba(0,0,0,0.8)`,
        animation:visible?"popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both":"none",
      }}>
        {/* Floating hearts background */}
        <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
          {hearts.map(h=>(
            <div key={h.id} style={{
              position:"absolute",left:`${h.x}%`,bottom:"-20px",
              fontSize:`${h.size}rem`,
              animation:`floatUp ${3+Math.random()*2}s ease-in ${h.delay}s infinite`,
              opacity:0.35,
            }}>💕</div>
          ))}
        </div>
        {/* Ribbon */}
        <div style={{
          position:"absolute",top:"1.2rem",right:"-2rem",
          background:`linear-gradient(135deg,${t.accent},#c0003c)`,
          padding:"0.35rem 3rem",
          fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"#fff",
          transform:"rotate(35deg)",
          boxShadow:"0 4px 12px rgba(0,0,0,0.4)",
        }}>Limited</div>
        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3rem",marginBottom:"0.3rem",animation:"heartBeat 1.5s ease infinite"}}>💖</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:t.accent,fontWeight:600,marginBottom:"0.3rem",textShadow:`0 0 25px ${t.accent}77`}}>
            Love is in the Air
          </div>
          <div style={{fontSize:"0.7rem",letterSpacing:"0.3em",textTransform:"uppercase",color:t.accent2,marginBottom:"1.2rem"}}>
            Valentine's Day · {holiday.name}
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>Surprise your partner with a romantic Nairobi escape. Our curated stays are perfect for couples — candles, views, and memories included.</p>
          }
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",
            background:"rgba(255,77,109,0.1)",border:`1px solid ${t.accent}44`,borderRadius:"12px",
            padding:"1rem 1.5rem",marginBottom:"1.4rem",
          }}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.8rem",color:t.accent,lineHeight:1}}>{holiday.discount}%</div>
              <div style={{fontSize:"0.65rem",color:t.accent2,letterSpacing:"0.2em",textTransform:"uppercase"}}>Discount</div>
            </div>
            <div style={{width:"1px",height:"50px",background:`${t.accent}33`}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"1.5rem"}}>💕</div>
              <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.5)",marginTop:"0.2rem"}}>For couples</div>
            </div>
          </div>
          <button onClick={onBook} style={{width:"100%",padding:"1rem",background:`linear-gradient(135deg,${t.accent},#c0003c)`,color:"#fff",border:"none",borderRadius:"10px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",marginBottom:"0.7rem",boxShadow:`0 8px 24px ${t.accent}55`}}>
            💕 Book a Romantic Stay
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:"0.75rem",cursor:"pointer"}}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}

// ── KENYA NATIONAL DAY POPUP (Madaraka / Jamhuri / Huduma / Mashujaa) ──
function KenyaDayPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const isMashujaa = holiday.id === "mashujaa";
  const [visible, setVisible] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  useEffect(()=>{
    setTimeout(()=>setVisible(true),80);
    const interval = setInterval(()=>setScanPos(p=>(p+2)%100),30);
    return ()=>clearInterval(interval);
  },[]);
  const flagColors = ["#006600","#CC0000","#000000","#FFFFFF"];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(500px,92vw)",borderRadius:"16px",overflow:"hidden",
        background:"linear-gradient(170deg,#000 0%,#001a00 60%,#1a0000 100%)",
        border:"2px solid transparent",
        backgroundClip:"padding-box",
        boxShadow:"0 0 0 2px #006600, 0 0 0 4px #CC0000, 0 0 80px rgba(0,102,0,0.4)",
        animation:visible?"bounceIn 0.7s ease both":"none",
      }}>
        {/* Kenya flag stripe across top */}
        <div style={{display:"flex",height:"8px"}}>
          {["#006600","#FFFFFF","#CC0000","#000000","#CC0000","#FFFFFF","#006600"].map((c,i)=>(
            <div key={i} style={{flex:1,background:c}}/>
          ))}
        </div>
        {/* Scan line effect */}
        <div style={{position:"absolute",top:`${scanPos}%`,left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,rgba(0,102,0,0.4),transparent)",pointerEvents:"none",zIndex:2,transition:"top 0.03s linear"}}/>
        <div style={{position:"relative",zIndex:1,padding:"2rem 2rem 1.8rem",textAlign:"center"}}>
          {/* Maasai shield emoji big */}
          <div style={{fontSize:"4rem",marginBottom:"0.3rem",filter:"drop-shadow(0 0 20px rgba(204,0,0,0.6))",animation:isMashujaa?"swing 2s ease infinite":"none"}}>
            {isMashujaa?"🛡️":"🇰🇪"}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:"#FFFFFF",fontWeight:600,marginBottom:"0.2rem",letterSpacing:"0.02em"}}>
            {holiday.name}
          </div>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.4em",textTransform:"uppercase",color:"#006600",marginBottom:"0.3rem"}}>
            Kenya Public Holiday
          </div>
          {/* Harambee divider */}
          <div style={{display:"flex",alignItems:"center",gap:"0.8rem",margin:"1rem 0"}}>
            <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,transparent,#CC0000)"}}/>
            <span style={{fontSize:"0.65rem",letterSpacing:"0.25em",color:"#CC0000",textTransform:"uppercase"}}>Harambee</span>
            <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,#006600,transparent)"}}/>
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>
                Celebrate Kenya in the heart of Nairobi. Book a premium Shikaz Homes stay this holiday weekend and enjoy a <strong style={{color:"#FFD700"}}>{holiday.discount}% patriot discount</strong>.
              </p>
          }
          {/* Discount block */}
          <div style={{background:"rgba(0,102,0,0.2)",border:"1px solid rgba(0,102,0,0.5)",borderRadius:"10px",padding:"1.2rem",marginBottom:"1.4rem",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,bottom:0,width:"4px",background:"linear-gradient(180deg,#006600,#CC0000,#000)"}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3rem",color:"#FFD700",fontWeight:700,lineHeight:1}}>{holiday.discount}%</div>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.25em",color:"rgba(255,255,255,0.6)",textTransform:"uppercase"}}>Holiday Discount</div>
          </div>
          <div style={{display:"flex",gap:"0.7rem"}}>
            <button onClick={onBook} style={{flex:1,padding:"1rem",background:"linear-gradient(135deg,#006600,#004400)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",boxShadow:"0 8px 20px rgba(0,102,0,0.5)"}}>
              {holiday.emoji} Claim Offer
            </button>
            <button onClick={onClose} style={{padding:"1rem 1.4rem",background:"transparent",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",fontSize:"0.82rem",color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>✕</button>
          </div>
        </div>
        {/* Flag stripe across bottom */}
        <div style={{display:"flex",height:"8px"}}>
          {["#000000","#FFFFFF","#CC0000","#006600","#CC0000","#FFFFFF","#000000"].map((c,i)=>(
            <div key={i} style={{flex:1,background:c}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EID POPUP ─────────────────────────────────────────────────────
function EidPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const [visible, setVisible] = useState(false);
  const [rotation, setRotation] = useState(0);
  useEffect(()=>{
    setTimeout(()=>setVisible(true),80);
    const iv = setInterval(()=>setRotation(r=>r+0.5),30);
    return ()=>clearInterval(iv);
  },[]);
  const stars = Array.from({length:12},(_,i)=>({ id:i, angle: (i/12)*360, dist:120+Math.random()*30 }));
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,10,5,0.94)",backdropFilter:"blur(12px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(460px,92vw)",borderRadius:"20px",overflow:"hidden",
        background:"linear-gradient(160deg,#001a0d 0%,#00260f 50%,#0a1500 100%)",
        border:`1px solid ${t.accent}55`,
        boxShadow:`0 0 100px ${t.accent}22, 0 40px 120px rgba(0,0,0,0.9)`,
        animation:visible?"popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both":"none",
      }}>
        {/* Rotating star field */}
        <div style={{position:"absolute",width:"300px",height:"300px",top:"50%",left:"50%",transform:`translate(-50%,-50%) rotate(${rotation}deg)`,pointerEvents:"none",opacity:0.15}}>
          {stars.map(s=>{
            const rad = (s.angle*Math.PI)/180;
            return <div key={s.id} style={{position:"absolute",left:`${50+Math.cos(rad)*s.dist/3}%`,top:`${50+Math.sin(rad)*s.dist/3}%`,fontSize:"0.6rem",animation:`starTwinkle ${1+Math.random()}s ease infinite ${Math.random()}s`}}>⭐</div>;
          })}
        </div>
        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.2rem"}}>🌙</div>
          <div style={{fontSize:"0.65rem",letterSpacing:"0.5em",textTransform:"uppercase",color:t.accent2,marginBottom:"0.4rem"}}>Eid Mubarak</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",color:t.accent,fontWeight:600,marginBottom:"0.3rem"}}>
            Blessed Holiday Offer
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:"0.5rem",marginBottom:"1.2rem"}}>
            {"⭐🌟✨⭐🌟".split("").filter(c=>c.trim()).map((e,i)=>(
              <span key={i} style={{animation:`starTwinkle ${1+i*0.2}s ease infinite ${i*0.1}s`,display:"inline-block"}}>{e}</span>
            ))}
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>
                Celebrate Eid with loved ones in a beautiful Nairobi home. Space, comfort, and warmth — ideal for family gatherings. Enjoy <strong style={{color:t.accent}}>{holiday.discount}% off</strong> this Eid season.
              </p>
          }
          <div style={{
            position:"relative",borderRadius:"12px",padding:"1.2rem 1.5rem",marginBottom:"1.4rem",
            background:`linear-gradient(135deg,${t.accent}22,transparent)`,
            border:`1px solid ${t.accent}44`,
          }}>
            <div style={{position:"absolute",top:"-1px",left:"50%",transform:"translateX(-50%)",padding:"0.15rem 1rem",background:`linear-gradient(135deg,${t.accent},${t.accent2})`,borderRadius:"0 0 8px 8px",fontSize:"0.6rem",fontWeight:700,color:"#000",letterSpacing:"0.15em",textTransform:"uppercase"}}>Eid Special</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3rem",color:t.accent,fontWeight:700,lineHeight:1,marginTop:"0.5rem"}}>{holiday.discount}%</div>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.5)",letterSpacing:"0.2em",textTransform:"uppercase"}}>Off your stay</div>
          </div>
          <button onClick={onBook} style={{width:"100%",padding:"1rem",background:`linear-gradient(135deg,${t.accent},#8b7022)`,color:"#000",border:"none",borderRadius:"10px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",marginBottom:"0.7rem"}}>
            🌙 Book Eid Stay
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:"0.75rem",cursor:"pointer"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── CHRISTMAS POPUP ────────────────────────────────────────────────
function ChristmasPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const [visible, setVisible] = useState(false);
  const snowflakes = Array.from({length:16},(_,i)=>({ id:i, x:Math.random()*100, delay:Math.random()*3, size:0.8+Math.random()*0.8, dur:3+Math.random()*3 }));
  useEffect(()=>{ setTimeout(()=>setVisible(true),80); },[]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,20,0,0.93)",backdropFilter:"blur(10px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(460px,92vw)",borderRadius:"20px",overflow:"hidden",
        background:"linear-gradient(160deg,#001400 0%,#002800 60%,#001400 100%)",
        border:`1px solid ${t.accent}44`,
        boxShadow:`0 0 60px rgba(255,51,51,0.2), 0 0 120px rgba(0,100,0,0.2), 0 40px 100px rgba(0,0,0,0.9)`,
        animation:visible?"slideInLeft 0.5s cubic-bezier(0.22,1,0.36,1) both":"none",
      }}>
        {/* Snowflakes */}
        <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
          {snowflakes.map(s=>(
            <div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:"-10px",fontSize:`${s.size}rem`,color:"#fff",opacity:0.4,animation:`confettiFall ${s.dur}s linear ${s.delay}s infinite`}}>❄️</div>
          ))}
        </div>
        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.2rem",filter:"drop-shadow(0 0 15px rgba(255,215,0,0.6))"}}>🎄</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.3rem",color:"#FFFFFF",fontWeight:600,marginBottom:"0.2rem"}}>
            Season&apos;s Greetings
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"1.2rem"}}>
            <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,transparent,#FF3333)"}}/>
            <span style={{fontSize:"0.65rem",letterSpacing:"0.3em",color:t.accent2,textTransform:"uppercase"}}>Christmas Special</span>
            <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,#006600,transparent)"}}/>
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.8)",lineHeight:1.7,marginBottom:"1.4rem"}}>
                Spend Christmas in a beautiful Nairobi home. Fireplace evenings, family dinners, and festive memories — all at <strong style={{color:t.accent2}}>{holiday.discount}% off</strong>.
              </p>
          }
          {/* Ornament discount display */}
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"1.5rem",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"1.5rem",animation:"swing 1.5s ease infinite"}}>🎁</div>
            <div style={{
              width:"110px",height:"110px",borderRadius:"50%",
              background:"radial-gradient(circle at 35% 35%,#FF6666,#CC0000)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow:"0 0 0 3px #FFD700, 0 0 30px rgba(204,0,0,0.5)",
              border:"4px solid #FFD700",
            }}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",color:"#fff",lineHeight:1,fontWeight:700}}>{holiday.discount}%</div>
              <div style={{fontSize:"0.55rem",color:"rgba(255,255,255,0.7)",letterSpacing:"0.2em",textTransform:"uppercase"}}>off</div>
            </div>
            <div style={{fontSize:"1.5rem",animation:"swing 1.5s ease 0.5s infinite"}}>🎄</div>
          </div>
          <button onClick={onBook} style={{width:"100%",padding:"1rem",background:"linear-gradient(135deg,#CC0000,#880000)",color:"#fff",border:"2px solid #FFD700",borderRadius:"10px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",marginBottom:"0.7rem",boxShadow:"0 8px 24px rgba(204,0,0,0.4)"}}>
            🎅 Book Christmas Stay
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:"0.75rem",cursor:"pointer"}}>No thanks</button>
        </div>
      </div>
    </div>
  );
}

// ── GENERIC / EASTER / LABOUR POPUP ───────────────────────────────
function GenericHolidayPopup({ holiday, onClose, onBook }) {
  const t = holiday.theme;
  const [visible, setVisible] = useState(false);
  const particles = t.particles ? t.particles.split("").filter(c=>c.trim()) : ["🎊","✨"];
  useEffect(()=>{ setTimeout(()=>setVisible(true),80); },[]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"relative",width:"min(460px,92vw)",borderRadius:"16px",overflow:"hidden",
        background:`linear-gradient(160deg,${t.bg} 0%,${t.bg}dd 100%)`,
        border:`1px solid ${t.accent}44`,
        boxShadow:`0 0 60px ${t.accent}22, 0 40px 100px rgba(0,0,0,0.8)`,
        animation:visible?"popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both":"none",
      }}>
        <Confetti count={16} colors={[t.accent,t.accent2,"#fff"]}/>
        {/* Diagonal accent bar */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"4px",background:`linear-gradient(90deg,${t.accent},${t.accent2},${t.accent})`}}/>
        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.3rem",filter:`drop-shadow(0 0 20px ${t.accent}88)`}}>{holiday.emoji}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:t.accent,fontWeight:600,marginBottom:"0.3rem"}}>
            {holiday.name}
          </div>
          <div style={{fontSize:"0.65rem",letterSpacing:"0.35em",textTransform:"uppercase",color:t.accent2,marginBottom:"1.2rem"}}>
            Holiday Special Offer
          </div>
          {holiday.customMsg
            ? <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>{holiday.customMsg}</p>
            : <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,marginBottom:"1.4rem"}}>
                Celebrate {holiday.name} with a premium Nairobi stay. Enjoy <strong style={{color:t.accent}}>{holiday.discount}% off</strong> all listings this holiday season.
              </p>
          }
          <div style={{
            background:`${t.accent}18`,border:`1px solid ${t.accent}44`,borderRadius:"12px",
            padding:"1.2rem 1.5rem",marginBottom:"1.4rem",
          }}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3rem",color:t.accent,fontWeight:700,lineHeight:1}}>{holiday.discount}%</div>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.5)",letterSpacing:"0.2em",textTransform:"uppercase",marginTop:"0.2rem"}}>Off your booking</div>
          </div>
          <button onClick={onBook} style={{width:"100%",padding:"1rem",background:`linear-gradient(135deg,${t.accent},${t.accent2})`,color:"#000",border:"none",borderRadius:"8px",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",marginBottom:"0.7rem"}}>
            {holiday.emoji} Claim Holiday Deal
          </button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:"0.75rem",cursor:"pointer"}}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

// ── POPUP DISPATCHER ───────────────────────────────────────────────
function HolidayPopup({ holiday, onClose, onBook }) {
  if (!holiday) return null;
  const props = { holiday, onClose, onBook };
  switch(holiday.theme?.bg) {
    case HOLIDAY_THEMES.new_year.bg:    return <NewYearPopup {...props}/>;
    case HOLIDAY_THEMES.valentines.bg:  return <ValentinesPopup {...props}/>;
    case HOLIDAY_THEMES.christmas.bg:   return <ChristmasPopup {...props}/>;
    case HOLIDAY_THEMES.kenya.bg:
    case HOLIDAY_THEMES.mashujaa.bg:    return <KenyaDayPopup {...props}/>;
    case HOLIDAY_THEMES.eid.bg:         return <EidPopup {...props}/>;
    default:                            return <GenericHolidayPopup {...props}/>;
  }
}

// ── PROMO BANNER (slim persistent strip) ──────────────────────────
function PromoBanner({ holiday, onOpen }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVisible(true),2000); },[]);
  if (!holiday || dismissed) return null;
  const t = holiday.theme;
  return (
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:8000,
      background:`linear-gradient(90deg,${t.bg},${t.accent}33,${t.bg})`,
      borderTop:`2px solid ${t.accent}88`,
      padding:"0.7rem 1.5rem",
      display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",
      transform:visible?"translateY(0)":"translateY(100%)",
      transition:"transform 0.5s cubic-bezier(0.22,1,0.36,1)",
      backdropFilter:"blur(10px)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:"0.8rem",flexShrink:0}}>
        <span style={{fontSize:"1.2rem",animation:"heartBeat 2s ease infinite"}}>{holiday.emoji}</span>
        <div>
          <span style={{fontSize:"0.78rem",fontWeight:700,color:t.accent,letterSpacing:"0.05em"}}>{holiday.name}: </span>
          <span style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.8)"}}>
            {holiday.discount}% off all stays
          </span>
        </div>
      </div>
      <div style={{display:"flex",gap:"0.6rem",alignItems:"center",flexShrink:0}}>
        <button onClick={onOpen} style={{padding:"0.4rem 1rem",background:t.accent,color:"#000",border:"none",borderRadius:"4px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
          View Deal
        </button>
        <button onClick={()=>setDismissed(true)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:"1rem",lineHeight:1}}>✕</button>
      </div>
    </div>
  );
}

// ── ADMIN: PROMOS MANAGER ──────────────────────────────────────────
function PromosManager({ promoConfig, onSave }) {
  const [local, setLocal] = useState(()=>{
    const base = {};
    KENYA_HOLIDAYS.forEach(h=>{ base[h.id] = { discount: h.defaultDiscount, disabled:false, message:"", ...(promoConfig[h.id]||{}) }; });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (id, field, val) => setLocal(prev=>({ ...prev, [id]:{ ...prev[id], [field]:val }}));

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.65rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Promotions</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>Holiday & Promo Manager</h2>
        <p style={{fontSize:"0.85rem",color:C.muted,marginTop:"0.5rem",lineHeight:1.6}}>Configure discounts and messages for Kenya public holidays. Popups auto-appear on your site in the days leading up to each holiday.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,380px),1fr))",gap:"1rem"}}>
        {KENYA_HOLIDAYS.map(h=>{
          const cfg = local[h.id] || {};
          const theme = HOLIDAY_THEMES[h.theme] || HOLIDAY_THEMES.kenya;
          const isActive = (()=>{
            const now = new Date(); const hDate = new Date(now.getFullYear(),h.month-1,h.day);
            const diff = Math.ceil((hDate-now)/(1000*60*60*24));
            return diff>=0 && diff<=h.daysAhead;
          })();
          return (
            <div key={h.id} style={{
              background:"#fff",border:`1px solid ${isActive?theme.accent+"66":C.border}`,
              borderRadius:"10px",overflow:"hidden",
              boxShadow:isActive?`0 4px 20px ${theme.accent}22`:"0 2px 8px rgba(14,43,31,0.05)",
              transition:"all 0.2s",
            }}>
              {/* Holiday header bar */}
              <div style={{
                padding:"0.9rem 1.2rem",
                background:isActive?`linear-gradient(135deg,${theme.bg},${theme.accent}22)`:"#F7F2EA",
                borderBottom:`1px solid ${C.border}`,
                display:"flex",alignItems:"center",justifyContent:"space-between",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
                  <span style={{fontSize:"1.4rem"}}>{h.emoji}</span>
                  <div>
                    <div style={{fontWeight:600,color:isActive?theme.accent:"#0E2B1F",fontSize:"0.9rem"}}>{h.name}</div>
                    <div style={{fontSize:"0.65rem",color:C.muted}}>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][h.month-1]} {h.day} · {h.daysAhead}d window
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                  {isActive&&<span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.1em",padding:"0.15rem 0.5rem",background:theme.accent+"33",color:theme.accent,border:`1px solid ${theme.accent}55`,borderRadius:"3px",textTransform:"uppercase"}}>Active Now</span>}
                  {/* Toggle */}
                  <button onClick={()=>update(h.id,"disabled",!cfg.disabled)}
                    style={{width:"38px",height:"20px",borderRadius:"10px",border:"none",cursor:"pointer",
                      background:cfg.disabled?"#ddd":"#16A34A",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                    <div style={{position:"absolute",top:"2px",left:cfg.disabled?"2px":"20px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
                  </button>
                </div>
              </div>

              {!cfg.disabled && (
                <div style={{padding:"1rem 1.2rem",display:"flex",flexDirection:"column",gap:"0.8rem"}}>
                  {/* Discount */}
                  <div>
                    <label style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.4rem"}}>
                      <span style={{fontSize:"0.7rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted}}>Discount %</span>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:C.gold,fontWeight:600}}>{cfg.discount}%</span>
                    </label>
                    <input type="range" min="5" max="50" value={cfg.discount||h.defaultDiscount}
                      onChange={e=>update(h.id,"discount",Number(e.target.value))}
                      style={{width:"100%",accentColor:C.gold}}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.62rem",color:C.muted,marginTop:"0.2rem"}}>
                      <span>5%</span><span>50%</span>
                    </div>
                  </div>
                  {/* Custom message */}
                  <div>
                    <label style={{fontSize:"0.7rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,display:"block",marginBottom:"0.4rem"}}>Custom Message (optional)</label>
                    <textarea value={cfg.message||""} onChange={e=>update(h.id,"message",e.target.value)}
                      placeholder={`Leave blank to use default ${h.name} message…`}
                      rows={2}
                      style={{width:"100%",padding:"0.6rem 0.8rem",border:`1px solid ${C.border}`,borderRadius:"5px",fontSize:"0.8rem",resize:"vertical",fontFamily:"inherit",outline:"none",background:"#FDFAF5",color:"#1C1C1C"}}
                      onFocus={e=>e.target.style.borderColor=C.gold}
                      onBlur={e=>e.target.style.borderColor=C.border}/>
                  </div>
                </div>
              )}
              {cfg.disabled && (
                <div style={{padding:"0.8rem 1.2rem",fontSize:"0.78rem",color:C.muted,fontStyle:"italic"}}>Popup disabled for this holiday</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{position:"sticky",bottom:"1rem",marginTop:"2rem",textAlign:"right"}}>
        <button onClick={handleSave} disabled={saving}
          style={{padding:"0.9rem 2.5rem",background:saved?"#16A34A":C.gold,color:saved?"#fff":"#0E2B1F",border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",letterSpacing:"0.12em",textTransform:"uppercase",cursor:saving?"not-allowed":"pointer",transition:"all 0.3s",boxShadow:"0 4px 16px rgba(197,151,58,0.3)"}}>
          {saving?"Saving…":saved?"✓ Saved!":"Save All Changes"}
        </button>
      </div>
    </div>
  );
}


// ─── UPCOMING HOLIDAYS PROMO SECTION ─────────────────────────────
// Research-backed windows: urgency peaks 14-21 days out, early birds
// book 30-60 days out for major holidays (Jamhuri, Christmas, NYE).
// Impulse bookings cluster 3-7 days before short holidays (Labour, Huduma).
function getUpcomingHolidays(promoConfig, count=6) {
  const now = new Date();
  const results = [];

  // Check both this year and next year to handle year-wrap
  for (const h of KENYA_HOLIDAYS) {
    for (const yearOffset of [0, 1]) {
      const hDate = new Date(now.getFullYear() + yearOffset, h.month - 1, h.day);
      const daysUntil = Math.ceil((hDate - now) / (1000*60*60*24));

      // Show holidays 3 to 90 days away (sweet spot per booking research)
      if (daysUntil < 3 || daysUntil > 90) continue;

      const cfg = promoConfig?.[h.id] || {};
      if (cfg.disabled) continue;

      const discount = cfg.discount ?? h.defaultDiscount;
      const theme = HOLIDAY_THEMES[h.theme] || HOLIDAY_THEMES.kenya;

      // Urgency tiers (drives copy + visual treatment)
      let urgency = "plan";        // 30-90 days
      if (daysUntil <= 7)  urgency = "urgent";  // last week
      else if (daysUntil <= 14) urgency = "soon";    // 1-2 weeks
      else if (daysUntil <= 21) urgency = "coming";  // 3 weeks

      results.push({ ...h, discount, theme, daysUntil, urgency, hDate, customMsg: cfg.message || "" });
    }
  }

  // Sort by proximity, deduplicate by id
  const seen = new Set();
  return results
    .sort((a,b) => a.daysUntil - b.daysUntil)
    .filter(h => { if(seen.has(h.id)) return false; seen.add(h.id); return true; })
    .slice(0, count);
}

const URGENCY = {
  urgent: { label:"This Week",   color:"#EF4444", bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)"  },
  soon:   { label:"Coming Soon", color:"#F59E0B", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)" },
  coming: { label:"Mark It",     color:C.gold,    bg:"rgba(197,151,58,0.12)", border:"rgba(197,151,58,0.3)" },
  plan:   { label:"Plan Ahead",  color:C.sage,    bg:"rgba(76,175,125,0.1)",  border:"rgba(76,175,125,0.25)"},
};

function CountdownPips({ days }) {
  // Visual dot-bar countdown — max 30 dots
  const MAX = Math.min(days, 30);
  const filled = Math.max(1, MAX);
  return (
    <div style={{display:"flex",gap:"2px",flexWrap:"wrap",marginTop:"0.5rem"}}>
      {Array.from({length:30}).map((_,i) => (
        <div key={i} style={{
          width:"5px", height:"5px", borderRadius:"50%",
          background: i < filled ? C.gold : "rgba(197,151,58,0.15)",
          transition:"background 0.3s",
        }}/>
      ))}
    </div>
  );
}

// Individual promo card — style varies by position in grid
function UpcomingHolidayCard({ holiday, index, onBook, isHero }) {
  const t = holiday.theme;
  const urg = URGENCY[holiday.urgency];
  const [hovered, setHovered] = useState(false);

  const daysLabel = holiday.daysUntil === 1 ? "Tomorrow!" :
                    holiday.daysUntil <= 7  ? `In ${holiday.daysUntil} days` :
                    holiday.daysUntil <= 14 ? `${holiday.daysUntil} days away` :
                    holiday.daysUntil <= 30 ? `${holiday.daysUntil} days away` :
                    `${Math.round(holiday.daysUntil/7)} weeks away`;

  const urgencyCopy = {
    urgent: ["Last chance rates", "Book before prices rise", "Filling up fast"],
    soon:   ["Early access deal", "Secure your dates now", "Best rooms going"],
    coming: ["Lock in this discount", "Smart early booking", "Best deal window"],
    plan:   ["Plan & save big", "Early bird price", "Most availability"],
  }[holiday.urgency];
  const tagline = urgencyCopy[index % urgencyCopy.length];

  if (isHero) {
    // Large hero card (first item)
    return (
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        style={{
          position:"relative", borderRadius:"14px", overflow:"hidden",
          background:`linear-gradient(145deg, ${t.bg} 0%, #0a1a0a 100%)`,
          border:`1px solid ${t.accent}44`,
          boxShadow: hovered ? `0 24px 80px ${t.accent}33, 0 0 0 1px ${t.accent}55` : `0 8px 32px rgba(0,0,0,0.3)`,
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition:"all 0.35s cubic-bezier(0.22,1,0.36,1)",
          cursor:"pointer", gridColumn:"1 / -1",
        }}
        onClick={onBook}
      >
        {/* Animated gradient shimmer */}
        <div style={{
          position:"absolute", inset:0, opacity: hovered ? 0.18 : 0.08,
          background:`radial-gradient(ellipse at 20% 50%, ${t.accent} 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, ${t.accent2} 0%, transparent 50%)`,
          transition:"opacity 0.35s",
          pointerEvents:"none",
        }}/>

        {/* Diagonal stripe accent */}
        <div style={{position:"absolute",top:0,right:0,width:"200px",height:"200px",overflow:"hidden",pointerEvents:"none"}}>
          <div style={{position:"absolute",top:"30px",right:"-50px",width:"200px",background:`linear-gradient(135deg,${t.accent},${t.accent2})`,padding:"0.5rem 3rem",fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.25em",textTransform:"uppercase",color:"#000",transform:"rotate(35deg)",whiteSpace:"nowrap"}}>
            {holiday.discount}% OFF
          </div>
        </div>

        <div style={{position:"relative",zIndex:1,padding:"2.5rem 2.5rem 2rem",display:"grid",gridTemplateColumns:"1fr auto",gap:"2rem",alignItems:"center"}}>
          <div>
            {/* Urgency badge */}
            <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",padding:"0.25rem 0.75rem",background:urg.bg,border:`1px solid ${urg.border}`,borderRadius:"20px",marginBottom:"1rem"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:urg.color,animation:"glowPulse 1.5s ease infinite"}}/>
              <span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:urg.color}}>{urg.label} · {daysLabel}</span>
            </div>

            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",color:"#fff",fontWeight:600,lineHeight:1.1,marginBottom:"0.6rem"}}>
              {holiday.emoji} {holiday.name}
            </div>
            <div style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.6)",marginBottom:"1.2rem",lineHeight:1.6}}>
              {holiday.customMsg || `${tagline} — enjoy ${holiday.discount}% off all Shikaz Homes listings for ${holiday.name}.`}
            </div>
            <div style={{display:"flex",gap:"0.7rem",alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={e=>{e.stopPropagation();onBook();}} style={{
                padding:"0.8rem 1.8rem",background:`linear-gradient(135deg,${t.accent},${t.accent2})`,
                color:"#000",border:"none",borderRadius:"6px",fontSize:"0.8rem",fontWeight:700,
                letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer",
                boxShadow:`0 8px 24px ${t.accent}44`,transition:"transform 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                Book with {holiday.discount}% Off →
              </button>
              <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>
                {holiday.hDate.toLocaleDateString("en-KE",{day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>
          </div>

          {/* Big discount number */}
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(4rem,8vw,6rem)",
              color:t.accent,fontWeight:700,lineHeight:0.9,
              textShadow:`0 0 60px ${t.accent}66`,
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition:"transform 0.35s",
            }}>{holiday.discount}%</div>
            <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",letterSpacing:"0.2em",textTransform:"uppercase",marginTop:"0.3rem"}}>discount</div>
            <CountdownPips days={holiday.daysUntil}/>
          </div>
        </div>
      </div>
    );
  }

  // Regular grid card
  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      onClick={onBook}
      style={{
        position:"relative",borderRadius:"12px",overflow:"hidden",cursor:"pointer",
        background:"#fff",
        border:`1px solid ${hovered ? t.accent+"88" : C.border}`,
        boxShadow: hovered ? `0 12px 40px ${t.accent}22, 0 0 0 1px ${t.accent}44` : "0 2px 12px rgba(14,43,31,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Coloured top bar with gradient */}
      <div style={{height:"5px",background:`linear-gradient(90deg,${t.accent},${t.accent2},${t.accent})`}}/>

      {/* Dark header with emoji */}
      <div style={{
        background:`linear-gradient(135deg,${t.bg} 0%,${t.bg}cc 100%)`,
        padding:"1.4rem 1.2rem 1.2rem",
        position:"relative",overflow:"hidden",
        minHeight:"90px",display:"flex",alignItems:"center",gap:"1rem",
      }}>
        <div style={{position:"absolute",right:"-10px",bottom:"-10px",fontSize:"4rem",opacity:0.12,transform:"rotate(-10deg)",userSelect:"none"}}>{holiday.emoji}</div>
        <div style={{fontSize:"2.2rem",filter:`drop-shadow(0 0 12px ${t.accent}88)`,flexShrink:0}}>{holiday.emoji}</div>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#fff",fontWeight:500,lineHeight:1.2}}>{holiday.name}</div>
          <div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.5)",marginTop:"0.2rem"}}>
            {holiday.hDate.toLocaleDateString("en-KE",{day:"numeric",month:"long"})}
          </div>
        </div>
        {/* Discount badge top-right */}
        <div style={{
          position:"absolute",top:"0.8rem",right:"0.8rem",
          background:`linear-gradient(135deg,${t.accent},${t.accent2})`,
          borderRadius:"20px",padding:"0.2rem 0.65rem",
          fontSize:"0.72rem",fontWeight:700,color:"#000",
          boxShadow:`0 4px 12px ${t.accent}44`,
        }}>{holiday.discount}% off</div>
      </div>

      <div style={{padding:"1rem 1.2rem 1.2rem"}}>
        {/* Urgency row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.7rem"}}>
          <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:urg.color,padding:"0.15rem 0.5rem",background:urg.bg,border:`1px solid ${urg.border}`,borderRadius:"3px"}}>
            {urg.label}
          </span>
          <span style={{fontSize:"0.75rem",color:C.muted,fontWeight:500}}>{daysLabel}</span>
        </div>

        <div style={{fontSize:"0.8rem",color:C.muted,lineHeight:1.6,marginBottom:"0.9rem"}}>
          {holiday.customMsg || tagline}
        </div>

        <CountdownPips days={holiday.daysUntil}/>

        <button
          onClick={e=>{e.stopPropagation();onBook();}}
          style={{
            width:"100%",marginTop:"0.9rem",padding:"0.7rem",
            background: hovered ? `linear-gradient(135deg,${t.accent},${t.accent2})` : "transparent",
            color: hovered ? "#000" : t.accent,
            border:`1px solid ${t.accent}66`,borderRadius:"5px",
            fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
            cursor:"pointer",transition:"all 0.25s",
          }}
        >
          {hovered ? `Book Now →` : `View Deal →`}
        </button>
      </div>
    </div>
  );
}

// Marquee ticker strip — for quick-glance awareness
function PromoTicker({ holidays }) {
  if (!holidays.length) return null;
  const items = [...holidays, ...holidays]; // duplicate for seamless loop
  return (
    <div style={{
      background:"linear-gradient(90deg,#0E2B1F,#1a3d2b,#0E2B1F)",
      borderTop:`1px solid rgba(197,151,58,0.2)`,
      borderBottom:`1px solid rgba(197,151,58,0.2)`,
      overflow:"hidden",padding:"0.55rem 0",
    }}>
      <div style={{display:"flex",gap:"0",animation:"tickerScroll 30s linear infinite",width:"max-content"}}>
        {items.map((h,i) => (
          <div key={i} style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0 2.5rem",borderRight:"1px solid rgba(197,151,58,0.15)",flexShrink:0}}>
            <span style={{fontSize:"0.9rem"}}>{h.emoji}</span>
            <span style={{fontSize:"0.7rem",fontWeight:600,color:h.theme.accent,letterSpacing:"0.05em"}}>{h.name}</span>
            <span style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.5)"}}>·</span>
            <span style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.7)"}}>{h.discount}% off</span>
            <span style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)"}}>·</span>
            <span style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.45)"}}>
              {h.daysUntil <= 7 ? `${h.daysUntil}d left` : h.daysUntil <= 30 ? `${h.daysUntil} days` : `${Math.round(h.daysUntil/7)}w away`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full upcoming promos section — injected into HomePage
function UpcomingPromosSection({ promoConfig, onNavigate, listings, onSelectWithHoliday }) {
  const upcoming = getUpcomingHolidays(promoConfig, 6);
  if (!upcoming.length) return null;

  const hero = upcoming[0];
  const rest = upcoming.slice(1);

  // Pick first available listing to send user to, carrying the holiday discount
  const goBook = (holiday) => {
    const target = listings && listings.find(l=>l.available);
    if(target && onSelectWithHoliday) {
      onSelectWithHoliday(target, holiday);
    } else {
      onNavigate("listings");
    }
  };

  return (
    <section style={{padding:"5rem 1.5rem",background:"linear-gradient(180deg,#F7F2EA 0%,#FDFAF5 100%)",position:"relative",overflow:"hidden"}}>
      {/* Subtle background pattern */}
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 1px 1px, rgba(197,151,58,0.08) 1px, transparent 0)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>

      <div style={{maxWidth:"1200px",margin:"0 auto",position:"relative"}}>
        {/* Section header */}
        <div style={{textAlign:"center",marginBottom:"3.5rem"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"0.7rem",marginBottom:"0.9rem"}}>
            <div style={{width:"32px",height:"1px",background:C.gold}}/>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.4em",textTransform:"uppercase",color:C.gold}}>Holiday Deals</div>
            <div style={{width:"32px",height:"1px",background:C.gold}}/>
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.9rem,4vw,3rem)",color:"#0E2B1F",fontWeight:400,marginBottom:"0.7rem"}}>
            Upcoming <em style={{color:C.gold,fontStyle:"italic"}}>Offers</em> & Holidays
          </h2>
          <p style={{fontSize:"0.9rem",color:C.muted,maxWidth:"480px",margin:"0 auto",lineHeight:1.8}}>
            Kenya's public holidays are the best time to book — lock in exclusive rates before they fill up.
          </p>
        </div>

        {/* Hero card full-width */}
        <div style={{marginBottom:"1.2rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr"}}>
            <UpcomingHolidayCard holiday={hero} index={0} isHero={true} onBook={()=>goBook(hero)}/>
          </div>
        </div>

        {/* Rest in responsive grid */}
        {rest.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:"1rem",marginBottom:"2.5rem"}}>
            {rest.map((h,i) => (
              <UpcomingHolidayCard key={h.id} holiday={h} index={i} isHero={false} onBook={()=>goBook(h)}/>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{textAlign:"center",marginTop:"2rem"}}>
          <button onClick={()=>onNavigate("listings")}
            style={{background:"transparent",color:C.gold,border:`1px solid rgba(197,151,58,0.4)`,padding:"0.9rem 2.5rem",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",borderRadius:"4px",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.goldDim;e.currentTarget.style.borderColor=C.gold;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(197,151,58,0.4)";}}>
            Browse All Listings →
          </button>
        </div>
      </div>
    </section>
  );
}


// ─── SITE CONTENT (About & Contact) ──────────────────────────────
const DEFAULT_SITE_CONTENT = {
  // Contact
  whatsapp: "254745802200",
  whatsappDisplay: "+254 745 802 200",
  email: "hello@shikazhomes.co.ke",
  phone: "+254 745 802 200",
  location: "Nairobi, Kenya",
  responseTime: "Within 1 hour",
  // About
  aboutHeroTitle: "Redefining the Nairobi stay",
  aboutHeroSubtitle: "Our Story",
  aboutHeroImage: "https://images.unsplash.com/photo-1580139861541-0f79bb4e9b30?w=1600&q=80",
  aboutParagraphs: [
    "Shikaz Homes was born from a simple belief: visitors to Nairobi deserve more than a generic hotel room. They deserve a home — one with character, comfort, and a genuine sense of place.",
    "We curate each property personally, inspecting for quality of furniture, internet reliability, security, and that indefinable sense of \"this just feels right\".",
    "Whether you\'re a solo professional on a two-week contract, a family relocating between schools, or a couple celebrating an anniversary — we have a space that will feel like yours from the moment you walk in.",
    "Nairobi is extraordinary. We think your stay should be too.",
  ],
  statFounded: "2020",
  statGuests: "440+",
  statRating: "4.95",
};

async function loadSiteContent() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:site_content").single();
    if (error || !data) return DEFAULT_SITE_CONTENT;
    return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(data.value) };
  } catch { return DEFAULT_SITE_CONTENT; }
}

async function saveSiteContent(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:site_content", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}


// ─── ADMIN: SITE CONTENT MANAGER ─────────────────────────────────
function SiteContentManager({ siteContent, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_SITE_CONTENT, ...(siteContent || {})
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [tab, setTab]       = useState("contact"); // "contact" | "about"

  // Sync if parent siteContent changes (e.g. loaded async)
  useEffect(() => {
    if (siteContent) setDraft(d => ({ ...d, ...siteContent }));
  }, [siteContent]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const setParagraph = (i, val) => {
    const paras = [...(draft.aboutParagraphs || DEFAULT_SITE_CONTENT.aboutParagraphs)];
    paras[i] = val;
    set("aboutParagraphs", paras);
  };
  const addParagraph    = () => set("aboutParagraphs", [...(draft.aboutParagraphs||[]), ""]);
  const removeParagraph = (i) => set("aboutParagraphs", (draft.aboutParagraphs||[]).filter((_,idx)=>idx!==i));

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const F = ({ label, children, hint }) => (
    <div style={{marginBottom:"1.1rem"}}>
      <label style={{display:"block",fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.4rem"}}>{label}</label>
      {children}
      {hint && <div style={{fontSize:"0.68rem",color:C.muted,marginTop:"0.3rem"}}>{hint}</div>}
    </div>
  );

  const inp = {
    width:"100%",padding:"0.75rem 0.9rem",border:`1px solid ${C.border}`,borderRadius:"5px",
    fontSize:"0.88rem",background:"#fff",color:"#1C1C1C",outline:"none",transition:"border-color 0.2s",
  };

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.65rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Site Content</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>About & Contact</h2>
        <p style={{fontSize:"0.85rem",color:C.muted,marginTop:"0.4rem"}}>Changes are saved to the database and appear live on the site immediately.</p>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:"0",marginBottom:"2rem",border:`1px solid ${C.border}`,borderRadius:"6px",overflow:"hidden",maxWidth:"360px"}}>
        {[{id:"contact",icon:"📞",label:"Contact Info"},{id:"about",icon:"📖",label:"About Us"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"0.75rem 1rem",background:tab===t.id?C.gold:"transparent",color:tab===t.id?C.obsidian:C.muted,border:"none",cursor:"pointer",fontSize:"0.78rem",fontWeight:tab===t.id?700:400,letterSpacing:"0.08em",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTACT TAB ── */}
      {tab==="contact"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,420px),1fr))",gap:"1.5rem"}}>

          {/* WhatsApp */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"1.2rem"}}>
              <span style={{fontSize:"1.4rem"}}>📱</span>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",fontWeight:500}}>WhatsApp</div>
            </div>
            <F label="Number (digits only, with country code)" hint="e.g. 254745802200 — used for wa.me links">
              <input value={draft.whatsapp||""} onChange={e=>set("whatsapp",e.target.value.replace(/\D/g,""))}
                placeholder="254745802200" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
            <F label="Display format" hint="Shown to visitors">
              <input value={draft.whatsappDisplay||""} onChange={e=>set("whatsappDisplay",e.target.value)}
                placeholder="+254 745 802 200" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
          </div>

          {/* Email & Phone */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"1.2rem"}}>
              <span style={{fontSize:"1.4rem"}}>✉️</span>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",fontWeight:500}}>Email & Phone</div>
            </div>
            <F label="Email address">
              <input value={draft.email||""} onChange={e=>set("email",e.target.value)}
                placeholder="hello@shikazhomes.co.ke" type="email" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
            <F label="Phone number (displayed + tel: link)">
              <input value={draft.phone||""} onChange={e=>set("phone",e.target.value)}
                placeholder="+254 745 802 200" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
          </div>

          {/* Location & Response */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"1.2rem"}}>
              <span style={{fontSize:"1.4rem"}}>◎</span>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",fontWeight:500}}>Location & Response</div>
            </div>
            <F label="Location (shown on contact page)">
              <input value={draft.location||""} onChange={e=>set("location",e.target.value)}
                placeholder="Nairobi, Kenya" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
            <F label="Response time">
              <input value={draft.responseTime||""} onChange={e=>set("responseTime",e.target.value)}
                placeholder="Within 1 hour" style={inp}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </F>
          </div>

          {/* Live preview */}
          <div style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,marginBottom:"1rem",fontWeight:600}}>Live Preview</div>
            {[
              {icon:"📱",label:"WhatsApp",val:draft.whatsappDisplay||draft.whatsapp,link:`https://wa.me/${draft.whatsapp}`},
              {icon:"✉️",label:"Email",val:draft.email,link:`mailto:${draft.email}`},
              {icon:"📞",label:"Phone",val:draft.phone},
              {icon:"◎",label:"Location",val:draft.location},
              {icon:"⏰",label:"Response",val:draft.responseTime},
            ].filter(i=>i.val).map(i=>(
              <div key={i.label} style={{display:"flex",gap:"0.7rem",alignItems:"flex-start",padding:"0.55rem 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:"0.9rem",flexShrink:0,marginTop:"0.05rem"}}>{i.icon}</span>
                <div>
                  <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted}}>{i.label}</div>
                  <div style={{fontSize:"0.83rem",color:i.link?C.gold:"#1C1C1C",fontWeight:i.link?500:400,wordBreak:"break-all"}}>{i.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {tab==="about"&&(
        <div style={{display:"grid",gap:"1.5rem"}}>

          {/* Hero */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:500}}>Hero Section</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <F label="Subtitle / eyebrow text">
                <input value={draft.aboutHeroSubtitle||""} onChange={e=>set("aboutHeroSubtitle",e.target.value)}
                  placeholder="Our Story" style={inp}
                  onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
              </F>
              <F label="Hero title">
                <input value={draft.aboutHeroTitle||""} onChange={e=>set("aboutHeroTitle",e.target.value)}
                  placeholder="Redefining the Nairobi stay" style={inp}
                  onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
              </F>
            </div>
            <F label="Hero background image URL" hint="Paste a full image URL — recommended 1600px wide">
              <div style={{display:"flex",gap:"0.6rem"}}>
                <input value={draft.aboutHeroImage||""} onChange={e=>set("aboutHeroImage",e.target.value)}
                  placeholder="https://images.unsplash.com/…" style={{...inp,flex:1}}
                  onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                {draft.aboutHeroImage&&(
                  <div style={{width:"80px",height:"44px",borderRadius:"4px",overflow:"hidden",flexShrink:0,border:`1px solid ${C.border}`}}>
                    <img src={draft.aboutHeroImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>e.target.style.display="none"}/>
                  </div>
                )}
              </div>
            </F>
          </div>

          {/* Stats */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:500}}>Statistics</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem"}}>
              {[{k:"statFounded",label:"Founded (year)"},{k:"statGuests",label:"Guests hosted"},{k:"statRating",label:"Avg rating"}].map(s=>(
                <F key={s.k} label={s.label}>
                  <input value={draft[s.k]||""} onChange={e=>set(s.k,e.target.value)} style={inp}
                    onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </F>
              ))}
            </div>
          </div>

          {/* Paragraphs */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.2rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:"#0E2B1F",fontWeight:500}}>About Text</div>
              <button onClick={addParagraph}
                style={{padding:"0.4rem 0.9rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"4px",fontSize:"0.72rem",color:C.gold,cursor:"pointer",fontWeight:600,letterSpacing:"0.08em",transition:"all 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                + Add Paragraph
              </button>
            </div>
            {(draft.aboutParagraphs||DEFAULT_SITE_CONTENT.aboutParagraphs).map((p,i)=>(
              <div key={i} style={{marginBottom:"0.9rem",position:"relative"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.3rem"}}>
                  <label style={{fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted}}>Paragraph {i+1}</label>
                  <button onClick={()=>removeParagraph(i)}
                    style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.8rem",padding:"0.1rem 0.3rem",transition:"color 0.15s"}}
                    onMouseEnter={e=>e.target.style.color=C.error}
                    onMouseLeave={e=>e.target.style.color=C.muted}>✕</button>
                </div>
                <textarea value={p} onChange={e=>setParagraph(i,e.target.value)} rows={3}
                  style={{...inp,resize:"vertical",lineHeight:1.6,fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor=C.gold}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            ))}
          </div>

          {/* Live hero preview */}
          <div style={{borderRadius:"10px",overflow:"hidden",border:`1px solid ${C.border}`,height:"200px",position:"relative"}}>
            <img src={draft.aboutHeroImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
            <div style={{position:"absolute",inset:0,background:"rgba(14,43,31,0.6)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"1.5rem 2rem"}}>
              <div style={{fontSize:"0.62rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.5rem"}}>{draft.aboutHeroSubtitle}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",color:"#F7F2EA",fontWeight:400}}>{draft.aboutHeroTitle}</div>
            </div>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div style={{position:"sticky",bottom:"1rem",marginTop:"2rem",textAlign:"right"}}>
        <button onClick={handleSave} disabled={saving}
          style={{padding:"0.9rem 2.5rem",background:saved?"#16A34A":C.gold,color:saved?"#fff":"#0E2B1F",border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",letterSpacing:"0.12em",textTransform:"uppercase",cursor:saving?"not-allowed":"pointer",transition:"all 0.3s",boxShadow:"0 4px 16px rgba(197,151,58,0.3)"}}>
          {saving?"Saving…":saved?"✓ Saved!":"Save Changes"}
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// ─── SHIKAZ AI CONCIERGE ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

const GROQ_API_KEY = "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";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

const CONCIERGE_SYSTEM = `You are Amara, the exclusive AI concierge for Shikaz Homes — a premium short-stay property company based in Nairobi, Kenya.

Your personality: warm, knowledgeable, sophisticated but never stuffy. You speak like a well-connected Nairobi local who knows every corner of the city. You use occasional Swahili words naturally (karibu, asante, sawa, pole pole, hakuna matata). You are helpful, proactive, and always steer people toward wonderful experiences.

Your capabilities:
1. RIDES — Help guests book Bolt or Uber rides. Give them the deep-link URLs to open the app with destination pre-filled. Always quote typical Nairobi fare ranges.
2. FOOD DELIVERY — Help with Bolt Food or Uber Eats orders. Suggest popular Nairobi restaurants/cuisines for delivery. Give app deep-link URLs.
3. TOURS & ACTIVITIES — Suggest tours, day trips, safaris, cultural experiences near Nairobi. Include: Nairobi National Park, Karen Blixen Museum, Giraffe Centre, Bomas of Kenya, Maasai Mara day trips, Hell's Gate, Lake Naivasha, Karura Forest walks, cycling tours, cooking classes, matatu art tours.
4. NIGHTLIFE — Suggest top Nairobi clubs, bars, rooftop spots: Alchemist Bar (Westlands), B-Club, Galileo Lounge, The Terrace at Sankara, Mercury Lounge, Black Diamond, Havana Bar, Trademark Hotel, K1 Klub House.
5. RESTAURANTS — Suggest great Nairobi dining: Carnivore, Tamarind, The Talisman (Karen), Java House, Artcaffe, Cultiva, About Thyme, Furusato Japanese, Mediterraneo, Mediteraneo Gigiri, Sarova Stanley restaurants, Tribe Hotel restaurant.
6. SHOPPING — Village Market, Westgate, Two Rivers Mall, Sarit Centre, The Junction, Yaya Centre, Maasai Market (Tuesdays at Village Market).
7. WELLNESS — Karura Forest, Ngong Hills hikes, Uhuru Gardens, Nairobi Arboretum.

Deep-link formats to use:
- Bolt ride: https://bolt.eu/en/cities/nairobi/?destination=[DESTINATION]
- Uber ride: https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=[DESTINATION]+Nairobi
- Bolt Food: https://food.bolt.eu/ (then suggest searching restaurant name)
- Uber Eats: https://www.ubereats.com/ke/
- Google Maps directions: https://www.google.com/maps/dir/?api=1&destination=[LAT],[LNG]

When suggesting rides always mention both Bolt and Uber options. When mentioning food delivery mention both Bolt Food and Uber Eats.

Formatting rules:
- Use short paragraphs, never walls of text
- Use emojis naturally but not excessively  
- When providing links, format them clearly
- For ride bookings, always ask for or confirm the destination first
- Always be aware the guest is staying in Nairobi at a Shikaz Homes property
- If asked about booking a Shikaz Homes property, refer them to the listings on the site
- Keep responses concise — 3-5 sentences max unless listing multiple options
- End responses with a helpful follow-up question when natural`;

// Quick-action suggestion chips
const QUICK_ACTIONS = [
  { icon:"🚗", label:"Book a Bolt/Uber" },
  { icon:"🍔", label:"Order food delivery" },
  { icon:"🦁", label:"Nearby tours & safaris" },
  { icon:"🌃", label:"Best nightlife spots" },
  { icon:"🍽️", label:"Restaurant suggestions" },
  { icon:"🛍️", label:"Shopping malls nearby" },
];

async function callGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role:"system", content:CONCIERGE_SYSTEM }, ...messages],
      max_tokens: 600,
      temperature: 0.75,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// Render message text — convert markdown-ish links and bold to JSX
function MessageContent({ text }) {
  // Split by newlines first
  const lines = text.split("\n").filter((l, i, arr) => !(l.trim() === "" && arr[i-1]?.trim() === ""));
  return (
    <div>
      {lines.map((line, li) => {
        if (!line.trim()) return <br key={li}/>;
        // Parse inline: **bold**, [text](url), bare https URLs
        const parts = [];
        let remaining = line;
        let ki = 0;
        const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s]+)/g;
        const boldRe = /\*\*(.+?)\*\*/g;
        // First pass: links
        let lastIdx = 0;
        let m;
        linkRe.lastIndex = 0;
        const segments = [];
        while ((m = linkRe.exec(remaining)) !== null) {
          if (m.index > lastIdx) segments.push({ type:"text", v: remaining.slice(lastIdx, m.index) });
          const label = m[1] || m[3];
          const url   = m[2] || m[3];
          segments.push({ type:"link", label, url });
          lastIdx = m.index + m[0].length;
        }
        if (lastIdx < remaining.length) segments.push({ type:"text", v: remaining.slice(lastIdx) });

        const rendered = segments.map((seg, si) => {
          if (seg.type === "link") {
            return (
              <a key={si} href={seg.url} target="_blank" rel="noreferrer"
                style={{color:C.gold,textDecoration:"underline",fontWeight:500,wordBreak:"break-all"}}>
                {seg.label.length > 40 ? seg.label.slice(0,38)+"…" : seg.label}
              </a>
            );
          }
          // bold pass
          const boldParts = [];
          let bl = 0, bm;
          boldRe.lastIndex = 0;
          while ((bm = boldRe.exec(seg.v)) !== null) {
            if (bm.index > bl) boldParts.push(seg.v.slice(bl, bm.index));
            boldParts.push(<strong key={bm.index}>{bm[1]}</strong>);
            bl = bm.index + bm[0].length;
          }
          if (bl < seg.v.length) boldParts.push(seg.v.slice(bl));
          return <span key={si}>{boldParts}</span>;
        });

        return <div key={li} style={{marginBottom: li < lines.length-1 ? "0.4rem" : 0}}>{rendered}</div>;
      })}
    </div>
  );
}

function ShikazConcierge({ listing, siteContent }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showChips, setShowChips] = useState(true);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const neighborhood = listing?.neighborhood || "Nairobi";
      const greeting = `Karibu! 🌟 I'm **Amara**, your Shikaz Homes concierge. I'm here to make your Nairobi stay unforgettable.

You're in **${neighborhood}** — one of the best spots in the city. I can help you book a **Bolt or Uber**, order **food delivery**, find incredible **restaurants**, plan **tours**, or discover the best **nightlife** nearby.

What can I sort out for you?`;
      setMessages([{ role:"assistant", content: greeting }]);
    }
  }, [open]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setShowChips(false);
    setError("");

    const newMessages = [...messages, { role:"user", content:userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Inject context about current listing if available
      const ctx = listing
        ? `[Context: Guest is staying at "${listing.name}" in ${listing.neighborhood}, Nairobi. Coordinates: ${listing.lat||"-1.2921"},${listing.lng||"36.8219"}]\n\n`
        : "";
      const msgsForApi = newMessages.map((m, i) =>
        i === 0 && m.role === "user" ? { ...m, content: ctx + m.content } : m
      );
      const reply = await callGroq(msgsForApi);
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    } catch(e) {
      setError("Samahani — connection hiccup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Typing indicator dots
  const TypingDots = () => (
    <div style={{display:"flex",gap:"4px",alignItems:"center",padding:"4px 0"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",background:C.gold,opacity:0.7,
          animation:`typingDot 1.2s ease infinite`,animationDelay:`${i*0.2}s`}}/>
      ))}
    </div>
  );

  return (
    <>
      {/* ── FAB BUTTON ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Shikaz AI Concierge"
        style={{
          position:"fixed", bottom:"1.5rem", right:"1.5rem", zIndex:8500,
          width:"60px", height:"60px", borderRadius:"50%", border:"none",
          background:`linear-gradient(135deg,#0E2B1F 0%,#1a3d2b 50%,${C.gold} 150%)`,
          boxShadow: open
            ? `0 0 0 3px ${C.gold}55, 0 8px 32px rgba(197,151,58,0.5)`
            : `0 4px 24px rgba(14,43,31,0.5), 0 0 0 1px rgba(197,151,58,0.3)`,
          cursor:"pointer",
          transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "rotate(45deg) scale(1.05)" : "scale(1)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onMouseEnter={e=>!open&&(e.currentTarget.style.transform="scale(1.12)")}
        onMouseLeave={e=>!open&&(e.currentTarget.style.transform="scale(1)")}
      >
        {open
          ? <span style={{fontSize:"1.4rem",color:"#fff"}}>✕</span>
          : <span style={{fontSize:"1.5rem"}}>✨</span>
        }
      </button>

      {/* Pulse ring when closed */}
      {!open && (
        <div style={{
          position:"fixed", bottom:"1.5rem", right:"1.5rem", zIndex:8499,
          width:"60px", height:"60px", borderRadius:"50%",
          border:`2px solid ${C.gold}`,
          animation:"conciergeRing 2.5s ease-out infinite",
          pointerEvents:"none",
        }}/>
      )}

      {/* ── CHAT PANEL ── */}
      {open && (
        <div style={{
          position:"fixed", bottom:"5.5rem", right:"1.5rem", zIndex:8500,
          width:"min(420px, calc(100vw - 2rem))",
          height:"min(580px, calc(100vh - 8rem))",
          background:"#fff",
          border:`1px solid ${C.border}`,
          borderRadius:"16px",
          boxShadow:"0 32px 80px rgba(14,43,31,0.25), 0 0 0 1px rgba(197,151,58,0.15)",
          display:"flex", flexDirection:"column",
          overflow:"hidden",
          animation:"conciergeOpen 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>

          {/* Header */}
          <div style={{
            background:"linear-gradient(135deg,#0E2B1F 0%,#1a3d2b 60%,#0E2B1F 100%)",
            padding:"1rem 1.2rem",
            flexShrink:0,
            borderBottom:`1px solid rgba(197,151,58,0.2)`,
            position:"relative",
            overflow:"hidden",
          }}>
            {/* Subtle pattern */}
            <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 2px 2px,rgba(197,151,58,0.06) 1px,transparent 0)",backgroundSize:"24px 24px",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:"0.9rem"}}>
              <div style={{
                width:"44px",height:"44px",borderRadius:"50%",flexShrink:0,
                background:`linear-gradient(135deg,${C.gold},#8B6914)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"1.3rem",
                boxShadow:`0 0 0 2px rgba(197,151,58,0.3), 0 4px 12px rgba(197,151,58,0.3)`,
              }}>✨</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#F7F2EA",fontWeight:500,letterSpacing:"0.01em"}}>Amara</div>
                <div style={{fontSize:"0.65rem",color:"rgba(247,242,234,0.55)",letterSpacing:"0.15em",textTransform:"uppercase"}}>Shikaz Concierge · Nairobi</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#4CAF7D",animation:"glowPulse 2s ease infinite"}}/>
                <span style={{fontSize:"0.62rem",color:"rgba(247,242,234,0.5)",letterSpacing:"0.1em"}}>Online</span>
              </div>
            </div>
            {listing && (
              <div style={{position:"relative",zIndex:1,marginTop:"0.6rem",padding:"0.4rem 0.7rem",background:"rgba(197,151,58,0.1)",border:"1px solid rgba(197,151,58,0.2)",borderRadius:"4px",fontSize:"0.68rem",color:"rgba(247,242,234,0.65)",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                <span>📍</span>
                <span>{listing.neighborhood}, Nairobi</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex:1, overflowY:"auto", padding:"1rem",
            display:"flex", flexDirection:"column", gap:"0.8rem",
            background:"#FDFAF5",
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display:"flex",
                flexDirection: m.role==="user" ? "row-reverse" : "row",
                alignItems:"flex-end",
                gap:"0.5rem",
                animation:"fadeUp 0.3s ease both",
              }}>
                {m.role==="assistant" && (
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",flexShrink:0}}>✨</div>
                )}
                <div style={{
                  maxWidth:"80%",
                  padding:"0.75rem 1rem",
                  borderRadius: m.role==="user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: m.role==="user"
                    ? `linear-gradient(135deg,#0E2B1F,#1a3d2b)`
                    : "#fff",
                  color: m.role==="user" ? "#F7F2EA" : "#1C1C1C",
                  fontSize:"0.85rem",
                  lineHeight:1.6,
                  boxShadow: m.role==="user"
                    ? "0 2px 12px rgba(14,43,31,0.2)"
                    : `0 2px 8px rgba(14,43,31,0.06), 0 0 0 1px ${C.border}`,
                }}>
                  {m.role==="assistant"
                    ? <MessageContent text={m.content}/>
                    : m.content
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{display:"flex",alignItems:"flex-end",gap:"0.5rem",animation:"fadeUp 0.3s ease"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem"}}>✨</div>
                <div style={{padding:"0.75rem 1rem",borderRadius:"4px 16px 16px 16px",background:"#fff",border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(14,43,31,0.06)"}}>
                  <TypingDots/>
                </div>
              </div>
            )}

            {error && (
              <div style={{textAlign:"center",fontSize:"0.75rem",color:C.error,padding:"0.5rem 1rem",background:"rgba(224,82,82,0.07)",borderRadius:"6px",border:"1px solid rgba(224,82,82,0.2)"}}>{error}</div>
            )}

            {/* Quick action chips */}
            {showChips && messages.length <= 1 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginTop:"0.4rem"}}>
                {QUICK_ACTIONS.map(a=>(
                  <button key={a.label} onClick={()=>send(a.label)}
                    style={{
                      padding:"0.45rem 0.8rem",background:"#fff",
                      border:`1px solid ${C.border}`,borderRadius:"20px",
                      fontSize:"0.72rem",color:"#0E2B1F",cursor:"pointer",
                      display:"flex",alignItems:"center",gap:"0.3rem",
                      transition:"all 0.2s",fontWeight:500,
                      boxShadow:"0 1px 4px rgba(14,43,31,0.06)",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.background=C.goldDim;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="#fff";}}>
                    <span>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            padding:"0.8rem 1rem",
            borderTop:`1px solid ${C.border}`,
            background:"#fff",
            flexShrink:0,
          }}>
            <div style={{display:"flex",gap:"0.6rem",alignItems:"flex-end"}}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything about Nairobi…"
                rows={1}
                style={{
                  flex:1, padding:"0.7rem 0.9rem",
                  border:`1.5px solid ${C.border}`,
                  borderRadius:"10px", fontSize:"0.85rem",
                  outline:"none", resize:"none", lineHeight:1.5,
                  fontFamily:"inherit", color:"#1C1C1C",
                  background:"#FDFAF5",
                  transition:"border-color 0.2s",
                  maxHeight:"80px", overflowY:"auto",
                }}
                onFocus={e=>e.target.style.borderColor=C.gold}
                onBlur={e=>e.target.style.borderColor=C.border}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,80)+"px";}}
              />
              <button onClick={()=>send()} disabled={!input.trim()||loading}
                style={{
                  width:"40px",height:"40px",borderRadius:"10px",flexShrink:0,
                  background: input.trim()&&!loading ? `linear-gradient(135deg,#0E2B1F,#1a3d2b)` : "#E5E7EB",
                  border:"none",cursor:input.trim()&&!loading?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"1rem",transition:"all 0.2s",
                  boxShadow:input.trim()&&!loading?"0 4px 12px rgba(14,43,31,0.3)":"none",
                }}>
                {loading
                  ? <div style={{width:"14px",height:"14px",border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  : <span style={{color:input.trim()?"#fff":"#9CA3AF"}}>↑</span>
                }
              </button>
            </div>
            <div style={{marginTop:"0.45rem",fontSize:"0.6rem",color:C.muted,textAlign:"center",letterSpacing:"0.08em"}}>
              Powered by Shikaz AI · Nairobi concierge
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ADMIN SYSTEM (Stage 3) ───────────────────────────────────────
const HOST_PIN = "1234"; // default PIN — editable in settings

async function loadAdminPin() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:pin").single();
    return (error || !data) ? HOST_PIN : data.value;
  } catch { return HOST_PIN; }
}
async function saveAdminPin(p) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:pin", value:p }, { onConflict:"key" }
    );
  } catch {}
}

// ── Login Screen ─────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const [shaking,setShaking]=useState(false);
  const [loading,setLoading]=useState(false);
  const [storedPin,setStoredPin]=useState(HOST_PIN);

  useEffect(()=>{ loadAdminPin().then(setStoredPin); },[]);

  const tryPin=(p)=>{
    if(p.length<4) return;
    setLoading(true);
    setTimeout(()=>{
      if(p===storedPin){ onLogin(); }
      else {
        setErr("Incorrect PIN. Try again.");
        setShaking(true);
        setPin("");
        setTimeout(()=>setShaking(false),600);
      }
      setLoading(false);
    },600);
  };

  const pad=(d)=>{
    const next=pin.length<4?pin+d:pin;
    setPin(next); setErr("");
    if(next.length===4) tryPin(next);
  };
  const del=()=>setPin(p=>p.slice(0,-1));

  return (
    <div style={{minHeight:"100vh",background:"#FDFAF5",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {/* Ambient bg */}
      <div style={{position:"absolute",inset:0,backgroundImage:"url(https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&q=60)",backgroundSize:"cover",backgroundPosition:"center",opacity:0.08}}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%,rgba(212,175,95,0.07) 0%,transparent 65%)"}}/>

      <div style={{position:"relative",width:"100%",maxWidth:"380px",padding:"1rem",animation:"fadeUp 0.6s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:"#F7F2EA",marginBottom:"0.3rem"}}>
            Shikaz<span style={{color:C.gold,fontStyle:"italic"}}>Homes</span>
          </div>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.muted}}>Host Portal</div>
        </div>

        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"14px",padding:"2.2rem",boxShadow:"0 32px 80px rgba(14,43,31,0.18)",animation:shaking?"shake 0.5s ease":"none"}}>
          <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
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
@keyframes disco{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}`}</style>

          <div style={{textAlign:"center",marginBottom:"1.8rem"}}>
            <div style={{width:"52px",height:"52px",borderRadius:"50%",background:C.goldDim,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",margin:"0 auto 1rem"}}>🔐</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",color:"#0E2B1F",marginBottom:"0.25rem"}}>Welcome back</div>
            <div style={{fontSize:"0.78rem",color:C.muted}}>Enter your 4-digit host PIN</div>
          </div>

          {/* PIN dots */}
          <div style={{display:"flex",justifyContent:"center",gap:"1rem",marginBottom:"2rem"}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:"14px",height:"14px",borderRadius:"50%",border:`2px solid ${pin.length>i?C.gold:"rgba(14,43,31,0.15)"}`,background:pin.length>i?C.gold:"transparent",transition:"all 0.2s"}}/>
            ))}
          </div>

          {/* Numpad */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.6rem",marginBottom:"0.8rem"}}>
            {[1,2,3,4,5,6,7,8,9].map(d=>(
              <button key={d} onClick={()=>pad(String(d))} disabled={loading} style={{padding:"1rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"8px",color:"#1C1C1C",fontSize:"1.2rem",fontWeight:500,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(197,151,58,0.15)";e.currentTarget.style.borderColor=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.background="#F7F2EA";e.currentTarget.style.borderColor=C.border;}}>{d}</button>
            ))}
            <div/> {/* empty */}
            <button onClick={()=>pad("0")} disabled={loading} style={{padding:"1rem",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:"8px",color:"#0E2B1F",fontSize:"1.2rem",fontWeight:500,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.goldDim;e.currentTarget.style.borderColor=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor=C.border;}}>0</button>
            <button onClick={del} style={{padding:"1rem",background:"#EEEBE4",border:`1px solid ${C.border}`,borderRadius:"8px",color:C.muted,fontSize:"1.1rem",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.cream} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>⌫</button>
          </div>

          {err&&<div style={{textAlign:"center",fontSize:"0.78rem",color:C.error,padding:"0.4rem",animation:"fadeIn 0.2s ease"}}>{err}</div>}
          {loading&&<div style={{textAlign:"center",marginTop:"0.6rem"}}><div style={{width:"20px",height:"20px",border:`2px solid ${C.goldDim}`,borderTop:`2px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/></div>}

          <div style={{textAlign:"center",marginTop:"1.2rem",fontSize:"0.7rem",color:"#6B6B5F"}}>Default PIN: <span style={{color:C.gold,fontFamily:"monospace"}}>1234</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.5rem 1.8rem",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
        <div style={{fontSize:"1.4rem"}}>{icon}</div>
        {sub&&<div style={{fontSize:"0.65rem",padding:"0.2rem 0.5rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"3px",color:C.gold,letterSpacing:"0.1em"}}>{sub}</div>}
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.9rem",color:color||C.gold,marginBottom:"0.3rem"}}>{value}</div>
      <div style={{fontSize:"0.72rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted}}>{label}</div>
    </div>
  );
}

// ── Mini Calendar for Admin ───────────────────────────────────────
function AdminMiniCalendar({ listing }) {
  const today=new Date(); today.setHours(0,0,0,0);
  const [year,setYear]=useState(today.getFullYear());
  const [month,setMonth]=useState(today.getMonth());
  const booked=new Set(listing.bookedDates||[]);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();
  const todayKey=toKey(today);
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.6rem"}}>
        <button onClick={prevM} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"1rem",padding:"0 0.3rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>‹</button>
        <span style={{fontSize:"0.78rem",color:"#F7F2EA",fontWeight:500}}>{MONTHS[month].slice(0,3)} {year}</span>
        <button onClick={nextM} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"1rem",padding:"0 0.3rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.55rem",color:C.muted,paddingBottom:"3px"}}>{d}</div>)}
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const key=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isBooked=booked.has(key);
          const isPast=key<todayKey;
          const isToday=key===todayKey;
          return (
            <div key={key} style={{textAlign:"center",padding:"3px 1px",borderRadius:"3px",fontSize:"0.65rem",background:isBooked?"rgba(224,82,82,0.18)":isToday?C.goldDim:"transparent",color:isBooked?C.error:isToday?C.gold:isPast?C.muted:C.mutedLight,fontWeight:isToday?700:400}}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dashboard Home ────────────────────────────────────────────────
function DashboardHome({ listings, bookings }) {
  const totalRevenue=bookings.reduce((s,b)=>s+(b.total||0),0);
  const totalNights=bookings.reduce((s,b)=>s+(b.nights||0),0);
  const avgNightly=bookings.length?Math.round(totalRevenue/bookings.length):0;
  const occupiedIds=new Set(bookings.map(b=>b.listing?.id));
  const allDatesBooked=listings.flatMap(l=>l.bookedDates||[]);
  const thisMonth=new Date().toISOString().slice(0,7);
  const thisMonthBookings=bookings.filter(b=>b.checkIn&&b.checkIn.startsWith(thisMonth));
  const thisMonthRev=thisMonthBookings.reduce((s,b)=>s+(b.total||0),0);

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Overview</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>Dashboard</h2>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"1rem",marginBottom:"2.5rem"}}>
        <StatCard icon="💰" label="Total Revenue" value={`KES ${fmt(totalRevenue)}`} sub="All time"/>
        <StatCard icon="📅" label="This Month" value={`KES ${fmt(thisMonthRev)}`} sub={`${thisMonthBookings.length} bookings`} color={C.goldLight}/>
        <StatCard icon="🏠" label="Active Listings" value={listings.length} sub="Live"/>
        <StatCard icon="🌙" label="Nights Booked" value={totalNights} sub="All time"/>
        <StatCard icon="👥" label="Guests Hosted" value={bookings.length} sub="Confirmed"/>
        <StatCard icon="⭐" label="Avg Rating" value="4.95" sub="Across all"/>
      </div>

      {/* Listings occupancy */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.5rem",marginBottom:"2rem",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:400}}>Listing Occupancy — June 2026</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
          {listings.map(l=>{
            const lBookings=bookings.filter(b=>b.listing?.id===l.id);
            const lNights=lBookings.reduce((s,b)=>s+(b.nights||0),0);
            const pct=Math.min(100,Math.round((lNights/30)*100));
            const lRev=lBookings.reduce((s,b)=>s+(b.total||0),0);
            return (
              <div key={l.id}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:C.mutedLight,marginBottom:"0.3rem"}}>
                  <span>{l.name}</span>
                  <span style={{color:C.gold}}>KES {fmt(lRev)} · {lNights}n</span>
                </div>
                <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.gold},${C.goldLight})`,borderRadius:"3px",transition:"width 0.8s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent bookings */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.5rem",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:400}}>Recent Bookings</div>
        {bookings.length===0?(
          <div style={{textAlign:"center",padding:"2rem",color:C.muted,fontSize:"0.85rem"}}>No bookings yet. When guests book, they'll appear here.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
            {[...bookings].reverse().slice(0,8).map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.8rem 1rem",background:"#F7F2EA",borderRadius:"6px",border:`1px solid ${C.border}`,flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.8rem"}}>
                  <div style={{width:"34px",height:"34px",borderRadius:"50%",background:C.goldDim,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",flexShrink:0}}>👤</div>
                  <div>
                    <div style={{fontSize:"0.85rem",color:"#0E2B1F",fontWeight:500}}>{b.name||"Guest"}</div>
                    <div style={{fontSize:"0.72rem",color:C.muted}}>{b.listing?.name} · {fmtDate(b.checkIn)} – {fmtDate(b.checkOut)}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.88rem",color:C.gold,fontWeight:600}}>KES {fmt(b.total)}</div>
                  <div style={{fontSize:"0.65rem",color:C.success,marginTop:"0.1rem"}}>✓ Confirmed · {b.ref}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bookings Manager ──────────────────────────────────────────────
function BookingsManager({ bookings, listings }) {
  const [search,setSearch]=useState("");
  const [filterL,setFilterL]=useState("all");
  const filtered=bookings.filter(b=>{
    const matchSearch=!search||(b.name||"").toLowerCase().includes(search.toLowerCase())||(b.ref||"").toLowerCase().includes(search.toLowerCase())||(b.listing?.name||"").toLowerCase().includes(search.toLowerCase());
    const matchL=filterL==="all"||(b.listing?.id===filterL);
    return matchSearch&&matchL;
  });
  const totalRev=filtered.reduce((s,b)=>s+(b.total||0),0);
  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Records</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>All Bookings</h2>
      </div>
      {/* Filters */}
      <div style={{display:"flex",gap:"0.8rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search guest, ref, property…"
          style={{flex:1,minWidth:"200px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.7rem 1rem",color:"#1C1C1C",fontSize:"0.85rem",outline:"none"}}
          onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
        <select value={filterL} onChange={e=>setFilterL(e.target.value)} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.7rem 1rem",color:"#1C1C1C",fontSize:"0.85rem",outline:"none",cursor:"pointer"}}>
          <option value="all">All Properties</option>
          {listings.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      {/* Summary row */}
      <div style={{display:"flex",gap:"1rem",marginBottom:"1.5rem",padding:"0.8rem 1.2rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"6px",fontSize:"0.8rem",color:C.muted,flexWrap:"wrap"}}>
        <span><span style={{color:C.gold,fontWeight:600}}>{filtered.length}</span> bookings</span>
        <span>·</span>
        <span>Total revenue: <span style={{color:C.gold,fontWeight:600}}>KES {fmt(totalRev)}</span></span>
        <span>·</span>
        <span>Nights: <span style={{color:C.gold,fontWeight:600}}>{filtered.reduce((s,b)=>s+(b.nights||0),0)}</span></span>
      </div>
      {filtered.length===0?(
        <div style={{textAlign:"center",padding:"4rem",color:C.muted,background:C.card,border:`1px solid ${C.border}`,borderRadius:"8px"}}>
          {bookings.length===0?"No bookings yet.":"No bookings match your search."}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
          {[...filtered].reverse().map((b,i)=>(
            <div key={i} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1.2rem 1.5rem",boxShadow:"0 2px 8px rgba(14,43,31,0.05)",display:"flex",gap:"1.5rem",alignItems:"center",flexWrap:"wrap"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:C.goldDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>👤</div>
              <div style={{flex:1,minWidth:"160px"}}>
                <div style={{fontWeight:500,color:"#0E2B1F",fontSize:"0.92rem"}}>{b.name||"Guest"}</div>
                <div style={{fontSize:"0.72rem",color:C.muted,marginTop:"0.15rem"}}>📱 {b.phone||"—"} · Ref: <span style={{color:C.gold}}>{b.ref}</span></div>
              </div>
              <div style={{flex:1,minWidth:"160px"}}>
                <div style={{fontSize:"0.85rem",color:C.mutedLight}}>{b.listing?.name}</div>
                <div style={{fontSize:"0.75rem",color:C.muted,marginTop:"0.15rem"}}>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.nights}n · {b.guests} guest{b.guests>1?"s":""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:C.gold}}>KES {fmt(b.total)}</div>
                <div style={{fontSize:"0.65rem",color:C.success,marginTop:"0.1rem"}}>✓ Confirmed</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────
function SettingsPanel({ onLogout }) {
  const [currentPin,setCurrentPin]=useState("");
  const [newPin,setNewPin]=useState("");
  const [confirmPin,setConfirmPin]=useState("");
  const [msg,setMsg]=useState(null);

  const changePin=async()=>{
    const stored=await loadAdminPin();
    if(currentPin!==stored){setMsg({type:"error",text:"Current PIN is incorrect."});return;}
    if(newPin.length!==4||!/^\d{4}$/.test(newPin)){setMsg({type:"error",text:"New PIN must be exactly 4 digits."});return;}
    if(newPin!==confirmPin){setMsg({type:"error",text:"New PINs don't match."});return;}
    await saveAdminPin(newPin);
    setMsg({type:"success",text:"PIN updated successfully."});
    setCurrentPin(""); setNewPin(""); setConfirmPin("");
  };

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Configuration</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>Settings</h2>
      </div>
      {/* PIN change */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",maxWidth:"480px",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",marginBottom:"1.2rem",fontWeight:400}}>Change Host PIN</div>
        {[{lbl:"Current PIN",val:currentPin,set:setCurrentPin},{lbl:"New PIN (4 digits)",val:newPin,set:setNewPin},{lbl:"Confirm New PIN",val:confirmPin,set:setConfirmPin}].map(f=>(
          <div key={f.lbl} style={{marginBottom:"0.9rem"}}>
            <label style={{display:"block",fontSize:"0.65rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.3rem"}}>{f.lbl}</label>
            <input type="password" maxLength={4} value={f.val} onChange={e=>f.set(e.target.value.replace(/\D/g,"").slice(0,4))}
              style={{width:"100%",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"4px",padding:"0.75rem 1rem",color:"#1C1C1C",fontSize:"1.2rem",letterSpacing:"0.5em",outline:"none",textAlign:"center"}}
              onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        ))}
        {msg&&<div style={{fontSize:"0.78rem",color:msg.type==="error"?C.error:C.success,padding:"0.5rem 0.8rem",background:msg.type==="error"?"rgba(224,82,82,0.08)":"rgba(76,175,125,0.08)",borderRadius:"4px",marginBottom:"0.8rem"}}>{msg.text}</div>}
        <button onClick={changePin} style={{background:C.gold,color:C.obsidian,border:"none",padding:"0.8rem 1.8rem",borderRadius:"5px",fontSize:"0.8rem",fontWeight:600,letterSpacing:"0.12em",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>Update PIN</button>
      </div>
      {/* Link to Site Content */}
      <div style={{background:C.goldDim,border:`1px solid rgba(197,151,58,0.35)`,borderRadius:"10px",padding:"1.4rem 1.6rem",marginBottom:"1.5rem",maxWidth:"480px",display:"flex",alignItems:"center",gap:"1rem"}}>
        <span style={{fontSize:"1.5rem",flexShrink:0}}>✏️</span>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.85rem",fontWeight:600,color:"#0E2B1F",marginBottom:"0.2rem"}}>Update Contact & About Info</div>
          <div style={{fontSize:"0.75rem",color:C.muted}}>Edit your contact details and About Us content from the Site Content tab.</div>
        </div>
      </div>
      {/* Logout */}
      <button onClick={onLogout} style={{background:"rgba(224,82,82,0.1)",color:C.error,border:"1px solid rgba(224,82,82,0.25)",padding:"0.7rem 1.8rem",borderRadius:"5px",fontSize:"0.8rem",fontWeight:500,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(224,82,82,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(224,82,82,0.1)";}}>
        Sign Out of Host Portal
      </button>
    </div>
  );
}

// ── STAGE 4: LISTING EDITOR ───────────────────────────────────────

const ALL_AMENITIES = [
  "WiFi","Fast WiFi","Smart TV","Netflix","Kitchen","Full Kitchen","Kitchenette",
  "Air Conditioning","Heating","Washing Machine","Dryer","Iron & Board",
  "Workspace","Gym Access","Gym","Pool","Rooftop Pool","Private Pool","Hot Tub",
  "Parking","Secure Parking","Parking x4","Garden Access","Private Garden",
  "BBQ","Fireplace","City View","River View","Mountain View",
  "24/7 Security","Security","Generator","Elevator","Pet Friendly",
  "Kids Play Area","Housekeeper","Gardener","Concierge",
  "Coffee Machine","Dishwasher","Microwave","Balcony",
];

const BADGE_OPTIONS = ["Guest Favourite","Popular","New","Business Pick","Design Pick","Luxury"];
const TYPE_OPTIONS  = ["Studio","Loft Studio","1-Bedroom Suite","2-Bedroom Apartment","3-Bedroom Villa","Penthouse Suite","Cottage","Apartment"];

// Shared field style
const field = {
  background:"#F7F2EA", border:`1px solid ${C.border}`,
  borderRadius:"5px", padding:"0.75rem 1rem",
  color:"#1C1C1C", fontSize:"0.88rem", outline:"none", width:"100%",
  transition:"border-color 0.2s",
};
const fieldFocus = e => e.target.style.borderColor = C.gold;
const fieldBlur  = e => e.target.style.borderColor = C.border;

// Section header inside editor
function EditorSection({ title, icon, children }) {
  const [open,setOpen]=useState(true);
  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",overflow:"hidden",marginBottom:"1.2rem",boxShadow:"0 2px 8px rgba(14,43,31,0.06)"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.4rem",background:"none",border:"none",cursor:"pointer",color:"#0E2B1F",borderBottom:open?`1px solid ${C.border}`:"none",background:open?"#fff":"#FAFAF7"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
          <span style={{fontSize:"1rem"}}>{icon}</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",fontWeight:500}}>{title}</span>
        </div>
        <span style={{color:C.muted,fontSize:"0.85rem",transition:"transform 0.2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </button>
      {open&&<div style={{padding:"1.4rem"}}>{children}</div>}
    </div>
  );
}

// Label + input wrapper
function Field({ label, children }) {
  return (
    <div style={{marginBottom:"1rem"}}>
      <label style={{display:"block",fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.35rem"}}>{label}</label>
      {children}
    </div>
  );
}

// Toast notification
function Toast({ msg, type, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2800); return()=>clearTimeout(t); },[]);
  return (
    <div style={{position:"fixed",bottom:"2rem",right:"2rem",zIndex:9999,background:type==="success"?"rgba(22,163,74,0.1)":"rgba(220,38,38,0.08)",border:`1px solid ${type==="success"?"rgba(76,175,125,0.4)":"rgba(224,82,82,0.4)"}`,borderRadius:"8px",padding:"0.9rem 1.4rem",color:type==="success"?C.success:C.error,fontSize:"0.85rem",fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"slideUp 0.3s ease",display:"flex",alignItems:"center",gap:"0.6rem"}}>
      <span>{type==="success"?"✓":"✕"}</span>{msg}
    </div>
  );
}

// Confirm dialog
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(14,43,31,0.72)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}} onClick={onCancel}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"2rem",maxWidth:"380px",width:"90%",animation:"slideUp 0.25s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"1.5rem",marginBottom:"0.8rem",textAlign:"center"}}>⚠️</div>
        <div style={{textAlign:"center",color:"#1C1C1C",fontSize:"0.92rem",lineHeight:1.6,marginBottom:"1.5rem"}}>{message}</div>
        <div style={{display:"flex",gap:"0.8rem"}}>
          <button onClick={onCancel} style={{flex:1,padding:"0.75rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.muted,cursor:"pointer",fontSize:"0.82rem"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"0.75rem",background:"rgba(224,82,82,0.15)",border:"1px solid rgba(224,82,82,0.3)",borderRadius:"5px",color:C.error,cursor:"pointer",fontSize:"0.82rem",fontWeight:600}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Photo Manager ─────────────────────────────────────────────────
function PhotoManager({ photos, onChange }) {
  const [newUrl,setNewUrl]=useState("");
  const [preview,setPreview]=useState(null);
  const [err,setErr]=useState("");
  const [dragging,setDragging]=useState(null);

  const addUrl=()=>{
    if(!newUrl.trim()){setErr("Enter a URL.");return;}
    if(photos.includes(newUrl.trim())){setErr("Already added.");return;}
    onChange([...photos,newUrl.trim()]);
    setNewUrl(""); setErr(""); setPreview(null);
  };

  const remove=(i)=>onChange(photos.filter((_,idx)=>idx!==i));
  const moveUp=(i)=>{ if(i===0) return; const a=[...photos]; [a[i-1],a[i]]=[a[i],a[i-1]]; onChange(a); };
  const moveDown=(i)=>{ if(i===photos.length-1) return; const a=[...photos]; [a[i],a[i+1]]=[a[i+1],a[i]]; onChange(a); };

  return (
    <div>
      {/* Current photos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.8rem",marginBottom:"1.2rem"}}>
        {photos.map((url,i)=>(
          <div key={i} style={{position:"relative",borderRadius:"6px",overflow:"hidden",border:`2px solid ${i===0?C.gold:C.border}`,background:C.ink}}>
            <img src={url} alt="" style={{width:"100%",height:"100px",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
            {i===0&&<div style={{position:"absolute",top:"0.3rem",left:"0.3rem",background:C.gold,color:C.obsidian,fontSize:"0.55rem",fontWeight:700,letterSpacing:"0.1em",padding:"0.15rem 0.4rem",borderRadius:"2px"}}>COVER</div>}
            {/* Controls */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",background:"rgba(14,43,31,0.85)"}}>
              <button onClick={()=>moveUp(i)} disabled={i===0} style={{flex:1,background:"none",border:"none",color:i===0?C.muted:C.mutedLight,cursor:i===0?"default":"pointer",padding:"0.3rem",fontSize:"0.9rem",transition:"color 0.15s"}} onMouseEnter={e=>{if(i>0)e.target.style.color=C.gold;}} onMouseLeave={e=>e.target.style.color=i===0?C.muted:C.mutedLight} title="Move left">←</button>
              <button onClick={()=>moveDown(i)} disabled={i===photos.length-1} style={{flex:1,background:"none",border:"none",color:i===photos.length-1?C.muted:C.mutedLight,cursor:i===photos.length-1?"default":"pointer",padding:"0.3rem",fontSize:"0.9rem",transition:"color 0.15s"}} onMouseEnter={e=>{if(i<photos.length-1)e.target.style.color=C.gold;}} onMouseLeave={e=>e.target.style.color=i===photos.length-1?C.muted:C.mutedLight} title="Move right">→</button>
              <button onClick={()=>remove(i)} style={{flex:1,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:"0.3rem",fontSize:"0.85rem",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted} title="Remove">✕</button>
            </div>
          </div>
        ))}
        {photos.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2rem",color:C.muted,fontSize:"0.82rem",border:`1px dashed ${C.border}`,borderRadius:"6px"}}>No photos yet. Add image URLs below.</div>}
      </div>
      {/* Add URL */}
      <div style={{display:"flex",gap:"0.6rem",marginBottom:"0.5rem"}}>
        <input value={newUrl} onChange={e=>{setNewUrl(e.target.value);setErr("");setPreview(e.target.value.trim()||null);}}
          placeholder="https://images.unsplash.com/…" style={{...field,flex:1}}
          onFocus={fieldFocus} onBlur={fieldBlur}
          onKeyDown={e=>e.key==="Enter"&&addUrl()}/>
        <button onClick={addUrl} style={{padding:"0.75rem 1.2rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:600,cursor:"pointer",fontSize:"0.82rem",flexShrink:0,transition:"background 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>Add</button>
      </div>
      {err&&<div style={{fontSize:"0.75rem",color:C.error,marginBottom:"0.4rem"}}>{err}</div>}
      {preview&&(
        <div style={{marginTop:"0.6rem",borderRadius:"6px",overflow:"hidden",height:"80px",border:`1px solid ${C.border}`}}>
          <img src={preview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/>
        </div>
      )}
      <div style={{fontSize:"0.7rem",color:C.muted,marginTop:"0.5rem"}}>Tip: Use Unsplash URLs (…unsplash.com/photo-…?w=1200&q=85) for best quality. First photo is the cover image.</div>
    </div>
  );
}

// ── Amenity Picker ────────────────────────────────────────────────
function AmenityPicker({ selected, onChange }) {
  const [custom,setCustom]=useState("");
  const toggle=(a)=>{
    if(selected.includes(a)) onChange(selected.filter(x=>x!==a));
    else onChange([...selected,a]);
  };
  const addCustom=()=>{
    const v=custom.trim();
    if(!v||selected.includes(v)) return;
    onChange([...selected,v]);
    setCustom("");
  };
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.45rem",marginBottom:"1rem"}}>
        {ALL_AMENITIES.map(a=>{
          const on=selected.includes(a);
          return (
            <button key={a} onClick={()=>toggle(a)} style={{padding:"0.35rem 0.8rem",background:on?C.goldDim:"#F7F2EA",border:`1px solid ${on?C.gold:C.border}`,borderRadius:"20px",color:on?C.gold:C.muted,fontSize:"0.73rem",cursor:"pointer",transition:"all 0.15s",fontWeight:on?500:400}}>
              {on&&<span style={{marginRight:"0.3rem"}}>✓</span>}{a}
            </button>
          );
        })}
      </div>
      {/* Custom amenity */}
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Add custom amenity…" style={{...field,flex:1}} onFocus={fieldFocus} onBlur={fieldBlur} onKeyDown={e=>e.key==="Enter"&&addCustom()}/>
        <button onClick={addCustom} style={{padding:"0.65rem 1rem",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.mutedLight,cursor:"pointer",fontSize:"0.8rem",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.mutedLight;}}>+ Add</button>
      </div>
      {/* Custom ones not in master list */}
      {selected.filter(a=>!ALL_AMENITIES.includes(a)).length>0&&(
        <div style={{marginTop:"0.6rem",display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
          {selected.filter(a=>!ALL_AMENITIES.includes(a)).map(a=>(
            <div key={a} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.3rem 0.7rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"20px",fontSize:"0.73rem",color:C.gold}}>
              {a}
              <button onClick={()=>onChange(selected.filter(x=>x!==a))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.75rem",padding:0,lineHeight:1}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── House Rules Editor ────────────────────────────────────────────
function RulesEditor({ rules, onChange }) {
  const [newRule,setNewRule]=useState("");
  const add=()=>{ const v=newRule.trim(); if(!v) return; onChange([...rules,v]); setNewRule(""); };
  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.45rem",marginBottom:"0.8rem"}}>
        {rules.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.55rem 0.9rem",background:"#F7F2EA",borderRadius:"5px",border:`1px solid ${C.border}`}}>
            <span style={{color:C.gold,fontSize:"0.75rem"}}>—</span>
            <span style={{flex:1,fontSize:"0.83rem",color:C.mutedLight}}>{r}</span>
            <button onClick={()=>onChange(rules.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.8rem",padding:"0 0.2rem",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted}>✕</button>
          </div>
        ))}
        {rules.length===0&&<div style={{fontSize:"0.8rem",color:C.muted,fontStyle:"italic"}}>No rules yet.</div>}
      </div>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <input value={newRule} onChange={e=>setNewRule(e.target.value)} placeholder="e.g. No smoking indoors" style={{...field,flex:1}} onFocus={fieldFocus} onBlur={fieldBlur} onKeyDown={e=>e.key==="Enter"&&add()}/>
        <button onClick={add} style={{padding:"0.65rem 1rem",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.mutedLight,cursor:"pointer",fontSize:"0.8rem",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.mutedLight;}}>+ Add</button>
      </div>
    </div>
  );
}

// ── Calendar Manager (booked dates) ──────────────────────────────
function BookedDateManager({ bookedDates, onChange }) {
  const today=new Date(); today.setHours(0,0,0,0);
  const todayKey=toKey(today);
  const [year,setYear]=useState(today.getFullYear());
  const [month,setMonth]=useState(today.getMonth());
  const booked=new Set(bookedDates);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  const prevM=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextM=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const toggleDay=(key)=>{
    if(booked.has(key)) onChange(bookedDates.filter(d=>d!==key));
    else onChange([...bookedDates,key].sort());
  };
  const upcoming=bookedDates.filter(d=>d>=todayKey).sort();
  const past=bookedDates.filter(d=>d<todayKey).sort();
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",alignItems:"start"}}>
        {/* Calendar */}
        <div style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.8rem"}}>
            <button onClick={prevM} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"1.1rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>‹</button>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",color:"#F7F2EA"}}>{MONTHS[month]} {year}</span>
            <button onClick={nextM} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"1.1rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
            {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.6rem",color:C.muted}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
            {cells.map((d,i)=>{
              if(!d) return <div key={i}/>;
              const key=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const isBooked=booked.has(key);
              const isPast=key<todayKey;
              const isToday=key===todayKey;
              return (
                <button key={key} onClick={()=>toggleDay(key)}
                  style={{padding:"4px 2px",borderRadius:"4px",border:"none",cursor:"pointer",fontSize:"0.72rem",background:isBooked?"rgba(224,82,82,0.2)":isToday?C.goldDim:"transparent",color:isBooked?C.error:isToday?C.gold:isPast?"rgba(120,120,140,0.5)":C.mutedLight,fontWeight:isToday||isBooked?600:400,transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!isBooked)e.target.style.background=C.goldDim; else e.target.style.background="rgba(224,82,82,0.35)";}}
                  onMouseLeave={e=>e.target.style.background=isBooked?"rgba(224,82,82,0.2)":isToday?C.goldDim:"transparent"}>
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{marginTop:"0.8rem",display:"flex",gap:"0.8rem",fontSize:"0.62rem",color:C.muted}}>
            <span style={{display:"flex",alignItems:"center",gap:"0.3rem"}}><span style={{width:"8px",height:"8px",background:"rgba(224,82,82,0.3)",borderRadius:"2px",display:"inline-block"}}/>Blocked</span>
            <span style={{display:"flex",alignItems:"center",gap:"0.3rem"}}><span style={{width:"8px",height:"8px",background:C.goldDim,borderRadius:"2px",display:"inline-block"}}/>Today</span>
          </div>
          <div style={{marginTop:"0.5rem",fontSize:"0.7rem",color:C.muted}}>Click any date to block / unblock it.</div>
        </div>
        {/* List */}
        <div>
          <div style={{marginBottom:"0.8rem"}}>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.gold,marginBottom:"0.5rem"}}>Upcoming Blocked ({upcoming.length})</div>
            {upcoming.length===0?<div style={{fontSize:"0.78rem",color:C.muted,fontStyle:"italic"}}>None</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",maxHeight:"180px",overflowY:"auto"}}>
                {upcoming.map(d=>(
                  <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.35rem 0.7rem",background:C.ink,borderRadius:"4px",border:`1px solid ${C.border}`}}>
                    <span style={{fontSize:"0.78rem",color:C.mutedLight}}>{fmtDate(d)}</span>
                    <button onClick={()=>onChange(bookedDates.filter(x=>x!==d))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.75rem"}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.5rem"}}>Past Blocked ({past.length})</div>
            {past.length===0?<div style={{fontSize:"0.78rem",color:C.muted,fontStyle:"italic"}}>None</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",maxHeight:"120px",overflowY:"auto",opacity:0.6}}>
                {[...past].reverse().map(d=>(
                  <div key={d} style={{padding:"0.3rem 0.7rem",background:C.ink,borderRadius:"4px",border:`1px solid ${C.border}`,fontSize:"0.75rem",color:C.muted}}>{fmtDate(d)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full Listing Editor ───────────────────────────────────────────
function ListingEditor({ listing, onSave, onCancel }) {
  const [draft,setDraft]=useState({...listing});
  const [toast,setToast]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);
  const [unsaved,setUnsaved]=useState(false);

  const set=(key,val)=>{ setDraft(d=>({...d,[key]:val})); setUnsaved(true); };

  const handleSave=async()=>{
    setSaving(true);
    await new Promise(r=>setTimeout(r,500));
    onSave(draft);
    setSaving(false);
    setUnsaved(false);
    setToast({msg:"Listing saved successfully!",type:"success"});
  };

  const handleCancel=()=>{
    if(unsaved) setConfirm({msg:"You have unsaved changes. Discard them?",onConfirm:onCancel});
    else onCancel();
  };

  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      {/* Editor header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.8rem",flexWrap:"wrap",gap:"1rem"}}>
        <div>
          <button onClick={handleCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.78rem",letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:"0.4rem",padding:0,marginBottom:"0.5rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>← All Listings</button>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",color:"#0E2B1F",fontWeight:400}}>Editing: <em style={{color:C.gold}}>{listing.name}</em></h2>
          {unsaved&&<div style={{fontSize:"0.7rem",color:"#64A0DC",marginTop:"0.3rem"}}>● Unsaved changes</div>}
        </div>
        <div style={{display:"flex",gap:"0.7rem",alignItems:"center"}}>
          {/* Live toggle */}
          <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.5rem 0.9rem",background:C.card,border:`1px solid ${C.border}`,borderRadius:"6px"}}>
            <span style={{fontSize:"0.72rem",color:C.muted}}>Status</span>
            <button onClick={()=>set("available",!draft.available)} style={{width:"38px",height:"20px",borderRadius:"10px",background:draft.available?"rgba(76,175,125,0.3)":"rgba(255,255,255,0.08)",border:`1px solid ${draft.available?"rgba(76,175,125,0.5)":C.border}`,position:"relative",cursor:"pointer",transition:"all 0.25s",padding:0}}>
              <div style={{width:"14px",height:"14px",borderRadius:"50%",background:draft.available?C.success:"rgba(120,120,140,0.6)",position:"absolute",top:"2px",left:draft.available?"21px":"2px",transition:"left 0.25s"}}/>
            </button>
            <span style={{fontSize:"0.72rem",color:draft.available?C.success:C.muted,fontWeight:600}}>{draft.available?"Live":"Paused"}</span>
          </div>
          <button onClick={handleSave} disabled={saving||!unsaved} style={{padding:"0.7rem 1.8rem",background:unsaved?C.gold:"rgba(212,175,95,0.25)",color:unsaved?C.obsidian:"rgba(212,175,95,0.5)",border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",letterSpacing:"0.12em",textTransform:"uppercase",cursor:unsaved?"pointer":"default",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"0.5rem"}} onMouseEnter={e=>{if(unsaved)e.currentTarget.style.background=C.goldLight;}} onMouseLeave={e=>{if(unsaved)e.currentTarget.style.background=C.gold;}}>
            {saving?<><div style={{width:"14px",height:"14px",border:`2px solid ${C.obsidian}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Saving…</>:"Save Changes"}
          </button>
        </div>
      </div>

      {/* ── SECTION: Core Info ── */}
      <EditorSection title="Core Information" icon="ℹ️">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <Field label="Listing Name">
            <input value={draft.name} onChange={e=>set("name",e.target.value)} style={field} onFocus={fieldFocus} onBlur={fieldBlur}/>
          </Field>
          <Field label="Tagline">
            <input value={draft.tagline} onChange={e=>set("tagline",e.target.value)} style={field} onFocus={fieldFocus} onBlur={fieldBlur} placeholder="Short catchy subtitle"/>
          </Field>
          <Field label="Neighbourhood">
            <input value={draft.neighborhood} onChange={e=>set("neighborhood",e.target.value)} style={field} onFocus={fieldFocus} onBlur={fieldBlur}/>
          </Field>
          <Field label="City">
            <input value={draft.city} onChange={e=>set("city",e.target.value)} style={field} onFocus={fieldFocus} onBlur={fieldBlur}/>
          </Field>
          <Field label="Property Type">
            <select value={draft.type} onChange={e=>set("type",e.target.value)} style={{...field,cursor:"pointer"}}>
              {TYPE_OPTIONS.map(t=><option key={t} value={t} style={{background:C.card}}>{t}</option>)}
            </select>
          </Field>
          <Field label="Badge">
            <select value={draft.badge} onChange={e=>set("badge",e.target.value)} style={{...field,cursor:"pointer"}}>
              {BADGE_OPTIONS.map(b=><option key={b} value={b} style={{background:C.card}}>{b}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginTop:"0.5rem"}}>
          {[{l:"Bedrooms",k:"bedrooms",min:0,max:10},{l:"Bathrooms",k:"bathrooms",min:1,max:10},{l:"Max Guests",k:"guests",min:1,max:20},{l:"Size (sqm)",k:"sqm",min:10,max:1000}].map(f=>(
            <Field key={f.k} label={f.l}>
              <input type="number" min={f.min} max={f.max} value={draft[f.k]} onChange={e=>set(f.k,Number(e.target.value))} style={field} onFocus={fieldFocus} onBlur={fieldBlur}/>
            </Field>
          ))}
        </div>
      </EditorSection>

      {/* ── SECTION: Pricing ── */}
      <EditorSection title="Pricing" icon="💰">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
          <Field label="Price Per Night (KES)">
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:"0.9rem",top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:"0.8rem"}}>KES</span>
              <input type="number" min={0} value={draft.pricePerNight} onChange={e=>set("pricePerNight",Number(e.target.value))} style={{...field,paddingLeft:"3rem"}} onFocus={fieldFocus} onBlur={fieldBlur}/>
            </div>
          </Field>
          <Field label="Cleaning Fee (KES)">
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:"0.9rem",top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:"0.8rem"}}>KES</span>
              <input type="number" min={0} value={draft.cleaningFee} onChange={e=>set("cleaningFee",Number(e.target.value))} style={{...field,paddingLeft:"3rem"}} onFocus={fieldFocus} onBlur={fieldBlur}/>
            </div>
          </Field>
          <Field label="Rating (display)">
            <input type="number" min={1} max={5} step={0.01} value={draft.rating} onChange={e=>set("rating",parseFloat(e.target.value))} style={field} onFocus={fieldFocus} onBlur={fieldBlur}/>
          </Field>
        </div>
        {/* Live pricing preview */}
        <div style={{marginTop:"0.5rem",background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"1rem 1.2rem",display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {[["1 night",draft.pricePerNight+draft.cleaningFee],["3 nights",3*draft.pricePerNight+draft.cleaningFee],["7 nights",7*draft.pricePerNight+draft.cleaningFee],["30 nights",30*draft.pricePerNight+draft.cleaningFee]].map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:"0.6rem",color:C.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:"0.2rem"}}>{l}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",color:C.gold}}>KES {fmt(v)}</div>
            </div>
          ))}
        </div>
      </EditorSection>

      {/* ── SECTION: Description ── */}
      <EditorSection title="Description" icon="📝">
        <Field label="About This Space">
          <textarea value={draft.description} onChange={e=>set("description",e.target.value)} rows={7} style={{...field,resize:"vertical",lineHeight:1.7}} onFocus={fieldFocus} onBlur={fieldBlur} placeholder="Describe the space in detail. Use two line breaks to separate paragraphs."/>
        </Field>
        <div style={{fontSize:"0.7rem",color:C.muted}}>Separate paragraphs with a blank line. This appears on the listing page.</div>
      </EditorSection>

      {/* ── SECTION: Photos ── */}
      <EditorSection title={`Photos (${draft.photos.length})`} icon="🖼️">
        <PhotoManager photos={draft.photos} onChange={v=>set("photos",v)}/>
      </EditorSection>

      {/* ── SECTION: Amenities ── */}
      <EditorSection title={`Amenities (${draft.amenities.length} selected)`} icon="✦">
        <AmenityPicker selected={draft.amenities} onChange={v=>set("amenities",v)}/>
      </EditorSection>

      {/* ── SECTION: House Rules ── */}
      <EditorSection title="House Rules" icon="📋">
        <RulesEditor rules={draft.houseRules} onChange={v=>set("houseRules",v)}/>
      </EditorSection>

      {/* ── SECTION: Calendar ── */}
      <EditorSection title={`Availability Calendar (${draft.bookedDates.length} blocked dates)`} icon="📅">
        <BookedDateManager bookedDates={draft.bookedDates} onChange={v=>set("bookedDates",v)}/>
      </EditorSection>

      {/* ── SECTION: Location ── */}
      <EditorSection title="Location & Map Pin" icon="📍">
        <div style={{marginBottom:"1rem"}}>
          <p style={{fontSize:"0.83rem",color:C.muted,lineHeight:1.7,marginBottom:"1rem"}}>
            Click on the map or drag the pin to set the exact location guests will see. This appears on the listing page with Google Maps, Apple Maps, and Waze links.
          </p>
          <LocationPicker
            lat={draft.lat || -1.2921}
            lng={draft.lng || 36.8219}
            onChange={({lat,lng})=>{ set("lat",lat); set("lng",lng); }}
          />
        </div>
        <div style={{marginTop:"0.8rem"}}>
          <Field label="Access Note for Guests (shown below the map)">
            <textarea
              value={draft.locationNote || ""}
              onChange={e=>set("locationNote",e.target.value)}
              placeholder="e.g. Green gate on Argwings Kodhek Road, ring the bell and mention Shikaz Homes. Parking inside compound."
              rows={3}
              style={{width:"100%",padding:"0.75rem 0.9rem",border:`1px solid ${C.border}`,borderRadius:"5px",fontSize:"0.85rem",resize:"vertical",fontFamily:"inherit",outline:"none",background:"#fff",color:"#1C1C1C",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor=C.gold}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
          </Field>
          <div style={{fontSize:"0.71rem",color:C.muted,marginTop:"0.4rem"}}>
            Tip: mention landmarks, gate colour, floor number, or parking instructions — anything that helps guests find you quickly.
          </div>
        </div>
        {draft.lat && draft.lng && (
          <div style={{marginTop:"1rem",padding:"0.6rem 0.9rem",background:"rgba(76,175,125,0.08)",border:"1px solid rgba(76,175,125,0.25)",borderRadius:"5px",fontSize:"0.76rem",color:"#4CAF7D",display:"flex",gap:"0.6rem",alignItems:"center"}}>
            <span>✓</span>
            <span>Pin set — <strong>{draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}</strong> · Will show on listing page</span>
          </div>
        )}
      </EditorSection>

      {/* Save bar */}
      {unsaved&&(
        <div style={{position:"sticky",bottom:"1.5rem",background:"rgba(14,43,31,0.97)",backdropFilter:"blur(12px)",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1rem 1.4rem",display:"flex",justifyContent:"space-between",alignItems:"center",animation:"slideUp 0.25s ease",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <span style={{fontSize:"0.82rem",color:C.mutedLight}}>You have unsaved changes.</span>
          <div style={{display:"flex",gap:"0.7rem"}}>
            <button onClick={handleCancel} style={{padding:"0.6rem 1.2rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.muted,cursor:"pointer",fontSize:"0.8rem"}}>Discard</button>
            <button onClick={handleSave} disabled={saving} style={{padding:"0.6rem 1.6rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:700,fontSize:"0.8rem",cursor:"pointer",transition:"background 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>{saving?"Saving…":"Save Changes"}</button>
          </div>
        </div>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {confirm&&<ConfirmDialog message={confirm.msg} onConfirm={()=>{setConfirm(null);confirm.onConfirm();}} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

// ── Listings overview grid (with edit buttons) ────────────────────
// ─── STAGE 6: CREATE & DELETE LISTINGS ───────────────────────────

const BLANK_LISTING = () => ({
  id: "lst-" + Date.now().toString(36),
  name: "",
  neighborhood: "",
  city: "Nairobi",
  tagline: "",
  type: "Studio",
  bedrooms: 1,
  bathrooms: 1,
  guests: 2,
  sqm: 45,
  pricePerNight: 5000,
  cleaningFee: 1000,
  rating: 5.0,
  reviewCount: 0,
  badge: "New",
  available: false,
  amenities: ["WiFi","Smart TV"],
  photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=85"],
  description: "",
  houseRules: ["No smoking","Check-in 2PM","Checkout 11AM"],
  bookedDates: [],
  lat: null,
  lng: null,
  locationNote: "",
});

// ── New Listing Wizard ────────────────────────────────────────────
function NewListingWizard({ onSave, onCancel }) {
  const [step, setStep] = useState(1); // 1=basics, 2=details, 3=photos, 4=pricing
  const [draft, setDraft] = useState(BLANK_LISTING());
  const [errors, setErrors] = useState({});
  const TOTAL = 4;

  const set = (k, v) => { setDraft(d => ({...d, [k]: v})); setErrors(e => ({...e, [k]: null})); };

  const validateStep = () => {
    const errs = {};
    if (step === 1) {
      if (!draft.name.trim())         errs.name = "Listing name is required";
      if (!draft.neighborhood.trim()) errs.neighborhood = "Neighbourhood is required";
      if (!draft.tagline.trim())      errs.tagline = "Tagline is required";
    }
    if (step === 3) {
      if (draft.photos.length === 0)  errs.photos = "At least one photo is required";
    }
    if (step === 4) {
      if (draft.pricePerNight < 500)  errs.pricePerNight = "Price must be at least KES 500";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, TOTAL)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const handlePublish = () => {
    if (!validateStep()) return;
    onSave({...draft, available: true});
  };
  const handleDraft = () => {
    onSave({...draft, available: false});
  };

  const STEPS = ["Basic Info","Details & Amenities","Photos","Pricing & Publish"];

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.04)",
    border:`1px solid ${C.border}`, borderRadius:"5px",
    padding:"0.78rem 1rem", color:"#1C1C1C", fontSize:"0.88rem", outline:"none",
  };
  const errStyle = {fontSize:"0.72rem", color:C.error, marginTop:"0.25rem"};
  const label = (txt) => (
    <div style={{fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.35rem"}}>{txt}</div>
  );

  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"2rem",flexWrap:"wrap"}}>
        <div>
          <button onClick={onCancel} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.78rem",letterSpacing:"0.12em",textTransform:"uppercase",padding:0,marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:"0.3rem"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>
            {"<"} Back to Listings
          </button>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.7rem",color:"#0E2B1F",fontWeight:400}}>
            Add New <em style={{color:C.gold}}>Listing</em>
          </h2>
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{display:"flex",gap:"0",marginBottom:"2rem",borderRadius:"6px",overflow:"hidden",border:`1px solid ${C.border}`}}>
        {STEPS.map((s,i)=>{
          const done = step > i+1;
          const active = step === i+1;
          return (
            <div key={s} onClick={()=>{ if(done) setStep(i+1); }} style={{flex:1,padding:"0.65rem 0.5rem",background:active?C.goldDim:done?"rgba(76,175,125,0.1)":C.card,borderRight:i<STEPS.length-1?`1px solid ${C.border}`:"none",cursor:done?"pointer":"default",transition:"all 0.2s",textAlign:"center"}}>
              <div style={{fontSize:"0.6rem",letterSpacing:"0.1em",textTransform:"uppercase",color:active?C.gold:done?C.success:"#9B9B8F",fontWeight:active?600:400}}>
                {done?"✓ ":""}{s}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"2rem",marginBottom:"1.5rem",minHeight:"360px",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>

        {/* ── Step 1: Basic Info ── */}
        {step===1&&(
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"1.5rem",fontWeight:400}}>Tell us about this property</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
              <div style={{gridColumn:"1/-1"}}>
                {label("Listing Name *")}
                <input value={draft.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Westlands Skyline Suite" style={inputStyle} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                {errors.name&&<div style={errStyle}>{errors.name}</div>}
              </div>
              <div style={{gridColumn:"1/-1"}}>
                {label("Tagline *")}
                <input value={draft.tagline} onChange={e=>set("tagline",e.target.value)} placeholder="e.g. Stunning views in the heart of the city" style={inputStyle} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                {errors.tagline&&<div style={errStyle}>{errors.tagline}</div>}
              </div>
              <div>
                {label("Neighbourhood *")}
                <input value={draft.neighborhood} onChange={e=>set("neighborhood",e.target.value)} placeholder="e.g. Kilimani" style={inputStyle} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                {errors.neighborhood&&<div style={errStyle}>{errors.neighborhood}</div>}
              </div>
              <div>
                {label("City")}
                <input value={draft.city} onChange={e=>set("city",e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              <div>
                {label("Property Type")}
                <select value={draft.type} onChange={e=>set("type",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                  {TYPE_OPTIONS.map(t=><option key={t} value={t} style={{background:C.card}}>{t}</option>)}
                </select>
              </div>
              <div>
                {label("Badge")}
                <select value={draft.badge} onChange={e=>set("badge",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                  {BADGE_OPTIONS.map(b=><option key={b} value={b} style={{background:C.card}}>{b}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:"1rem"}}>
              {label("Description")}
              <textarea value={draft.description} onChange={e=>set("description",e.target.value)} rows={4} placeholder="Describe the space — what makes it special, who it's perfect for..." style={{...inputStyle,resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          </div>
        )}

        {/* ── Step 2: Details & Amenities ── */}
        {step===2&&(
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"1.5rem",fontWeight:400}}>Space details & what's included</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
              {[{l:"Bedrooms",k:"bedrooms",min:0,max:10},{l:"Bathrooms",k:"bathrooms",min:1,max:10},{l:"Max Guests",k:"guests",min:1,max:20},{l:"Size (sqm)",k:"sqm",min:10,max:2000}].map(f=>(
                <div key={f.k}>
                  {label(f.l)}
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    <button onClick={()=>set(f.k,Math.max(f.min,draft[f.k]-1))} style={{width:"30px",height:"36px",border:`1px solid ${C.border}`,background:"none",color:"#0E2B1F",borderRadius:"4px",cursor:"pointer",fontSize:"1.1rem",transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.cream;}}>-</button>
                    <input type="number" min={f.min} max={f.max} value={draft[f.k]} onChange={e=>set(f.k,Number(e.target.value))} style={{...inputStyle,textAlign:"center",flex:1}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                    <button onClick={()=>set(f.k,Math.min(f.max,draft[f.k]+1))} style={{width:"30px",height:"36px",border:`1px solid ${C.border}`,background:"none",color:"#0E2B1F",borderRadius:"4px",cursor:"pointer",fontSize:"1.1rem",transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color="#F7F2EA";}}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#0E2B1F",marginBottom:"1rem",fontWeight:400}}>Amenities</div>
            <AmenityPicker selected={draft.amenities} onChange={v=>set("amenities",v)}/>
            <div style={{marginTop:"1.5rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#0E2B1F",marginBottom:"0.8rem",fontWeight:400}}>House Rules</div>
              <RulesEditor rules={draft.houseRules} onChange={v=>set("houseRules",v)}/>
            </div>
          </div>
        )}

        {/* ── Step 3: Photos ── */}
        {step===3&&(
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"0.5rem",fontWeight:400}}>Add photos</div>
            <div style={{fontSize:"0.8rem",color:C.muted,marginBottom:"1.2rem"}}>Add at least one photo. The first photo is used as the cover image on listing cards.</div>
            {errors.photos&&<div style={{...errStyle,marginBottom:"0.8rem",padding:"0.5rem 0.8rem",background:"rgba(224,82,82,0.08)",borderRadius:"4px",border:"1px solid rgba(224,82,82,0.2)"}}>{errors.photos}</div>}
            <PhotoManager photos={draft.photos} onChange={v=>set("photos",v)}/>
          </div>
        )}

        {/* ── Step 4: Pricing & Publish ── */}
        {step===4&&(
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"1.5rem",fontWeight:400}}>Set your pricing</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.5rem"}}>
              <div>
                {label("Price Per Night (KES) *")}
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"0.9rem",top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:"0.8rem",pointerEvents:"none"}}>KES</span>
                  <input type="number" min={500} value={draft.pricePerNight} onChange={e=>set("pricePerNight",Number(e.target.value))} style={{...inputStyle,paddingLeft:"3.5rem"}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                {errors.pricePerNight&&<div style={errStyle}>{errors.pricePerNight}</div>}
              </div>
              <div>
                {label("Cleaning Fee (KES)")}
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:"0.9rem",top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:"0.8rem",pointerEvents:"none"}}>KES</span>
                  <input type="number" min={0} value={draft.cleaningFee} onChange={e=>set("cleaningFee",Number(e.target.value))} style={{...inputStyle,paddingLeft:"3.5rem"}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>
            </div>

            {/* Live preview card */}
            <div style={{background:"rgba(197,151,58,0.08)",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1.2rem",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.8rem"}}>Pricing Preview</div>
              <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
                {[[1,draft.pricePerNight+draft.cleaningFee],[3,3*draft.pricePerNight+draft.cleaningFee],[7,7*draft.pricePerNight+draft.cleaningFee],[30,30*draft.pricePerNight+draft.cleaningFee]].map(([n,v])=>(
                  <div key={n}>
                    <div style={{fontSize:"0.6rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em"}}>{n} night{n>1?"s":""}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:C.gold}}>KES {fmt(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Listing summary */}
            <div style={{background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1.2rem"}}>
              <div style={{fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.8rem"}}>Listing Summary</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem"}}>
                {[["Name",draft.name||"—"],["Location",draft.neighborhood||"—"],["Type",draft.type],["Capacity",`${draft.bedrooms}bd · ${draft.bathrooms}ba · ${draft.guests} guests`],["Photos",`${draft.photos.length} photo${draft.photos.length!==1?"s":""}`],["Amenities",`${draft.amenities.length} included`]].map(([l,v])=>(
                  <div key={l} style={{padding:"0.4rem 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",gap:"0.5rem",fontSize:"0.8rem"}}>
                    <span style={{color:C.muted}}>{l}</span>
                    <span style={{color:"#1C1C1C",textAlign:"right",maxWidth:"55%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"1rem"}}>
        <div style={{fontSize:"0.72rem",color:C.muted}}>Step {step} of {TOTAL}</div>
        <div style={{display:"flex",gap:"0.7rem"}}>
          {step>1&&(
            <button onClick={prev} style={{padding:"0.75rem 1.4rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.muted,cursor:"pointer",fontSize:"0.8rem",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(247,242,234,0.2)";e.currentTarget.style.color="rgba(247,242,234,0.6)";}}>
              Back
            </button>
          )}
          {step<TOTAL&&(
            <button onClick={next} style={{padding:"0.75rem 1.8rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:700,fontSize:"0.82rem",cursor:"pointer",transition:"background 0.2s",letterSpacing:"0.05em"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
              Continue
            </button>
          )}
          {step===TOTAL&&(
            <div style={{display:"flex",gap:"0.6rem"}}>
              <button onClick={handleDraft} style={{padding:"0.75rem 1.4rem",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:"5px",color:C.mutedLight,cursor:"pointer",fontSize:"0.8rem",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                Save as Draft
              </button>
              <button onClick={handlePublish} style={{padding:"0.75rem 1.8rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:700,fontSize:"0.82rem",cursor:"pointer",transition:"background 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
                Publish Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Updated AdminListingCard with delete ──────────────────────────
function AdminListingCard({ listing, bookings, onEdit, onDelete }) {
  const lBookings=bookings.filter(b=>b.listing?.id===listing.id);
  const lRev=lBookings.reduce((s,b)=>s+(b.total||0),0);
  const bookedCount=(listing.bookedDates||[]).length;
  const [hov,setHov]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);

  return (
    <div style={{background:"#fff",border:`1px solid ${hov?C.borderHover:C.border}`,borderRadius:"10px",overflow:"hidden",transition:"all 0.25s",boxShadow:hov?"0 12px 32px rgba(14,43,31,0.14)":"0 2px 10px rgba(14,43,31,0.07)"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{height:"140px",overflow:"hidden",position:"relative"}}>
        {listing.photos[0]
          ? <img src={listing.photos[0]} alt={listing.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.5s",transform:hov?"scale(1.05)":"scale(1)"}}/>
          : <div style={{width:"100%",height:"100%",background:C.ink,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",color:C.muted}}>🏠</div>
        }
        <div style={{position:"absolute",top:"0.6rem",left:"0.6rem",background:"rgba(14,43,31,0.82)",backdropFilter:"blur(8px)",borderRadius:"4px",padding:"0.2rem 0.5rem",fontSize:"0.62rem",color:listing.available?"#5EB578":C.error,fontWeight:600,letterSpacing:"0.08em"}}>
          {listing.available?"● LIVE":"● PAUSED"}
        </div>
        {/* Delete button */}
        <button onClick={e=>{e.stopPropagation();setConfirmDel(true);}} style={{position:"absolute",top:"0.6rem",right:"0.6rem",background:"rgba(224,82,82,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(224,82,82,0.3)",borderRadius:"4px",padding:"0.2rem 0.5rem",fontSize:"0.65rem",color:C.error,cursor:"pointer",fontWeight:600,transition:"all 0.15s",opacity:hov?1:0}} onMouseEnter={e=>e.currentTarget.style.background="rgba(224,82,82,0.3)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(224,82,82,0.15)"}>
          Delete
        </button>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 40%,rgba(14,43,31,0.45) 100%)",pointerEvents:"none"}}/>
      </div>
      <div style={{padding:"1.1rem"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#0E2B1F",marginBottom:"0.2rem",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{listing.name||<span style={{color:C.muted,fontStyle:"italic"}}>Untitled listing</span>}</div>
        <div style={{fontSize:"0.72rem",color:C.muted,marginBottom:"0.8rem"}}>{listing.neighborhood||"—"} · {listing.type}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem",marginBottom:"1rem"}}>
          {[{l:"Rate/night",v:`KES ${fmt(listing.pricePerNight)}`},{l:"Revenue",v:`KES ${fmt(lRev)}`},{l:"Nights blocked",v:bookedCount},{l:"Bookings",v:lBookings.length}].map(s=>(
            <div key={s.l} style={{background:"#F7F2EA",borderRadius:"4px",padding:"0.45rem 0.65rem"}}>
              <div style={{fontSize:"0.58rem",color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{s.l}</div>
              <div style={{fontSize:"0.8rem",color:C.gold,fontWeight:500,marginTop:"0.1rem"}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:"0.9rem"}}><AdminMiniCalendar listing={listing}/></div>
        <button onClick={onEdit} style={{width:"100%",padding:"0.65rem",background:hov?C.goldDim:"rgba(255,255,255,0.04)",border:`1px solid ${hov?C.gold:C.border}`,borderRadius:"5px",color:hov?C.gold:C.muted,cursor:"pointer",fontSize:"0.78rem",fontWeight:500,letterSpacing:"0.1em",transition:"all 0.2s",textTransform:"uppercase"}}>
          Edit Listing
        </button>
      </div>
      {confirmDel&&(
        <ConfirmDialog
          message={`Permanently delete "${listing.name}"? This cannot be undone.`}
          onConfirm={()=>{setConfirmDel(false);onDelete(listing.id);}}
          onCancel={()=>setConfirmDel(false)}
        />
      )}
    </div>
  );
}

// ── AdminListings with create + delete ───────────────────────────
function AdminListings({ listings, bookings, onUpdate, onCreate, onDelete }) {
  const [mode,setMode]=useState("grid"); // "grid" | "new" | "edit"
  const [editing,setEditing]=useState(null);
  const [toast,setToast]=useState(null);

  const handleSaveEdit=async(updated)=>{
    await onUpdate(updated);
    setMode("grid"); setEditing(null);
    setToast({msg:"Listing updated successfully!",type:"success"});
  };

  const handleCreate=async(newListing)=>{
    await onCreate(newListing);
    setMode("grid");
    setToast({msg:`"${newListing.name}" ${newListing.available?"published!":"saved as draft."}`,type:"success"});
  };

  const handleDelete=async(id)=>{
    await onDelete(id);
    setToast({msg:"Listing deleted.",type:"success"});
  };

  if(mode==="edit"&&editing) return <ListingEditor listing={editing} onSave={handleSaveEdit} onCancel={()=>{setMode("grid");setEditing(null);}}/>;
  if(mode==="new") return <NewListingWizard onSave={handleCreate} onCancel={()=>setMode("grid")}/>;

  const live   = listings.filter(l=>l.available);
  const paused = listings.filter(l=>!l.available);

  return (
    <div>
      {/* Header row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
        <div>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Portfolio</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>All Listings</h2>
          <div style={{display:"flex",gap:"1rem",marginTop:"0.4rem",fontSize:"0.78rem"}}>
            <span style={{color:C.success}}>● {live.length} Live</span>
            <span style={{color:C.muted}}>● {paused.length} Paused</span>
            <span style={{color:C.muted}}>{listings.length} Total</span>
          </div>
        </div>
        <button onClick={()=>setMode("new")} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.8rem 1.6rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",cursor:"pointer",transition:"background 0.2s",letterSpacing:"0.05em",flexShrink:0}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
          + New Listing
        </button>
      </div>

      {listings.length===0?(
        <div style={{textAlign:"center",padding:"5rem 2rem",background:"#fff",border:`2px dashed ${C.border}`,borderRadius:"12px"}}>
          <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🏠</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",color:"#0E2B1F",marginBottom:"0.6rem"}}>No listings yet</div>
          <div style={{fontSize:"0.85rem",color:C.muted,marginBottom:"1.5rem"}}>Create your first listing to get started.</div>
          <button onClick={()=>setMode("new")} style={{padding:"0.8rem 2rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.82rem",cursor:"pointer"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
            + Add First Listing
          </button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1.2rem"}}>
          {listings.map(l=>(
            <AdminListingCard key={l.id} listing={l} bookings={bookings}
              onEdit={()=>{setEditing(l);setMode("edit");}}
              onDelete={handleDelete}
            />
          ))}
          {/* Add new card */}
          <button onClick={()=>setMode("new")} style={{background:"transparent",border:`2px dashed ${C.border}`,borderRadius:"10px",padding:"2rem",cursor:"pointer",transition:"all 0.25s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.7rem",minHeight:"280px",color:C.muted}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.sage;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            <div style={{fontSize:"2rem",lineHeight:1}}>+</div>
            <div style={{fontSize:"0.82rem",fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase"}}>Add Listing</div>
          </button>
        </div>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── STAGE 5: iCAL SYNC ENGINE ───────────────────────────────────

// ── ICS parser ───────────────────────────────────────────────────
function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const getVal = (key) => {
      const m = block.match(new RegExp(`${key}[^:]*:([^\\r\\n]+)`));
      return m ? m[1].trim() : null;
    };
    const rawStart = getVal("DTSTART");
    const rawEnd   = getVal("DTEND");
    const summary  = getVal("SUMMARY") || "Blocked";
    const uid      = getVal("UID") || Math.random().toString(36);
    if (!rawStart) continue;
    const parseDate = (s) => {
      // handles YYYYMMDD and YYYYMMDDTHHmmssZ
      const d = s.replace(/T.*/, "");
      return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
    };
    const start = parseDate(rawStart);
    const end   = rawEnd ? parseDate(rawEnd) : start;
    // expand range into individual dates (end date exclusive in iCal)
    const dates = [];
    let cur = start;
    while (cur < end) {
      dates.push(cur);
      cur = addDays(cur, 1);
    }
    if (dates.length === 0) dates.push(start);
    events.push({ uid, summary, start, end, dates });
  }
  return events;
}

// ── ICS generator (export) ────────────────────────────────────────
function generateICS(listing, bookings) {
  const allBookings = bookings.filter(b => b.listing?.id === listing.id);
  const now = new Date().toISOString().replace(/[-:.]/g,"").slice(0,15)+"Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShikazHomes//ShikazHomes Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${listing.name} — Shikaz Homes`,
    "X-WR-TIMEZONE:Africa/Nairobi",
  ];
  // From confirmed bookings
  for (const b of allBookings) {
    if (!b.checkIn || !b.checkOut) continue;
    const dtStart = b.checkIn.replace(/-/g,"");
    const dtEnd   = b.checkOut.replace(/-/g,"");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.ref}@shikazhomes`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:Booked — ${b.name || "Guest"} (${b.ref})`,
      `DESCRIPTION:Guest: ${b.name}\\nPhone: ${b.phone || ""}\\nTotal: KES ${fmt(b.total)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }
  // From manually blocked dates — group consecutive dates into ranges
  const blocked = [...new Set(listing.bookedDates || [])].sort();
  if (blocked.length > 0) {
    // Group into contiguous ranges
    const ranges = [];
    let rangeStart = blocked[0], prev = blocked[0];
    for (let i = 1; i < blocked.length; i++) {
      const expected = addDays(prev, 1);
      if (blocked[i] === expected) { prev = blocked[i]; }
      else { ranges.push([rangeStart, addDays(prev,1)]); rangeStart = blocked[i]; prev = blocked[i]; }
    }
    ranges.push([rangeStart, addDays(prev,1)]);
    for (const [s, e] of ranges) {
      // skip if already covered by a booking
      const coveredByBooking = allBookings.some(b => b.checkIn <= s && b.checkOut >= e);
      if (coveredByBooking) continue;
      lines.push(
        "BEGIN:VEVENT",
        `UID:blocked-${s}-${e}@shikazhomes`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${s.replace(/-/g,"")}`,
        `DTEND;VALUE=DATE:${e.replace(/-/g,"")}`,
        "SUMMARY:Blocked — Shikaz Homes",
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Platform configs
const PLATFORMS = [
  { id:"airbnb",     name:"Airbnb",        color:"#FF5A5F", icon:"🏠", hint:"Listing → Availability → Export Calendar" },
  { id:"booking",    name:"Booking.com",   color:"#003580", icon:"🔵", hint:"Extranet → Calendar → iCal Export" },
  { id:"vrbo",       name:"VRBO",          color:"#1B5FB4", icon:"🏡", hint:"Dashboard → Calendars → Export" },
  { id:"tripadvisor",name:"Tripadvisor",   color:"#00A680", icon:"🦉", hint:"Owner Dashboard → Calendar → Export URL" },
  { id:"agoda",      name:"Agoda Homes",   color:"#E5322D", icon:"🔴", hint:"Property → Calendar → Sync" },
  { id:"manual",     name:"Manual / Other",color:"#7A7A8C", icon:"📁", hint:"Any .ics file from any source" },
];

// Storage for sync configs
async function loadSyncConfigs() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:syncconfigs").single();
    return (error || !data) ? {} : JSON.parse(data.value);
  } catch { return {}; }
}
async function saveSyncConfigs(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:syncconfigs", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}
async function loadSyncLog() {
  try {
    const { data, error } = await supabase
      .from("kv_store").select("value").eq("key","shikaz:synclog").single();
    return (error || !data) ? [] : JSON.parse(data.value);
  } catch { return []; }
}
async function saveSyncLog(d) {
  try {
    await supabase.from("kv_store").upsert(
      { key:"shikaz:synclog", value:JSON.stringify(d) }, { onConflict:"key" }
    );
  } catch {}
}

// ── Import Modal ──────────────────────────────────────────────────
function ImportModal({ listing, platform, onClose, onImport }) {
  const [tab,setTab]=useState("file"); // file | url | paste
  const [url,setUrl]=useState("");
  const [pasteText,setPasteText]=useState("");
  const [result,setResult]=useState(null); // {events, dates, raw}
  const [status,setStatus]=useState("idle"); // idle | loading | done | error
  const [errMsg,setErrMsg]=useState("");
  const fileRef = useState(null);

  const processICS = (text, source) => {
    try {
      const events = parseICS(text);
      if (events.length === 0) { setErrMsg("No events found in this calendar file."); setStatus("error"); return; }
      const dates = [...new Set(events.flatMap(e => e.dates))];
      setResult({ events, dates, raw: text, source });
      setStatus("done");
    } catch(e) {
      setErrMsg("Could not parse this file. Make sure it is a valid .ics calendar file.");
      setStatus("error");
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".ics") && file.type !== "text/calendar") {
      setErrMsg("Please select a .ics calendar file."); setStatus("error"); return;
    }
    setStatus("loading");
    const reader = new FileReader();
    reader.onload = (ev) => processICS(ev.target.result, file.name);
    reader.readAsText(file);
  };

  const handleUrl = async () => {
    if (!url.trim()) { setErrMsg("Enter a valid calendar URL."); return; }
    setStatus("loading"); setErrMsg("");
    // Simulate fetching (real CORS fetch would need a proxy)
    await new Promise(r => setTimeout(r, 1400));
    // Demo: generate a realistic looking parsed result for the demo
    const demoEvents = [
      { uid:"demo-1", summary:"Airbnb — Not available", start:"2026-07-01", end:"2026-07-04", dates:["2026-07-01","2026-07-02","2026-07-03"] },
      { uid:"demo-2", summary:"Airbnb — Not available", start:"2026-07-10", end:"2026-07-13", dates:["2026-07-10","2026-07-11","2026-07-12"] },
      { uid:"demo-3", summary:"Booking.com — Reservation", start:"2026-07-20", end:"2026-07-23", dates:["2026-07-20","2026-07-21","2026-07-22"] },
    ];
    const dates = [...new Set(demoEvents.flatMap(e => e.dates))];
    setResult({ events: demoEvents, dates, source: url.trim(), isDemo: true });
    setStatus("done");
  };

  const handlePaste = () => {
    if (!pasteText.trim()) { setErrMsg("Paste your .ics content above."); return; }
    setStatus("loading"); setErrMsg("");
    setTimeout(() => processICS(pasteText, "Pasted calendar"), 400);
  };

  const handleApply = (mode) => {
    // mode: "merge" | "replace"
    onImport({ listing, result, mode });
    onClose();
  };

  const p = PLATFORMS.find(p=>p.id===platform) || PLATFORMS[PLATFORMS.length-1];
  const overlay = {position:"fixed",inset:0,background:"rgba(14,43,31,0.72)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(8px)"};
  const box = {background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflowY:"auto",animation:"slideUp 0.3s ease",boxShadow:"0 32px 80px rgba(0,0,0,0.6)"};

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{padding:"1.5rem 1.8rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card,zIndex:2}}>
          <div>
            <div style={{fontSize:"0.62rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold,marginBottom:"0.3rem"}}>Import Calendar</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F"}}>{listing.name}</div>
            <div style={{fontSize:"0.75rem",color:C.muted,marginTop:"0.1rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <span style={{color:p.color}}>{p.icon}</span>{p.name}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:"1.3rem",cursor:"pointer"}} onMouseEnter={e=>e.target.style.color=C.cream} onMouseLeave={e=>e.target.style.color=C.muted}>✕</button>
        </div>

        <div style={{padding:"1.5rem 1.8rem"}}>
          {/* Instructions */}
          <div style={{background:C.goldDim,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.8rem 1rem",marginBottom:"1.2rem",fontSize:"0.78rem",color:C.mutedLight,display:"flex",gap:"0.6rem",alignItems:"flex-start"}}>
            <span style={{color:C.gold,flexShrink:0}}>ℹ</span>
            <span><strong style={{color:C.gold}}>{p.name} tip:</strong> {p.hint}</span>
          </div>

          {/* Tab selector */}
          <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.2rem",background:"#F7F2EA",borderRadius:"6px",padding:"0.3rem"}}>
            {[{id:"file",label:"📁 Upload .ics"},{id:"url",label:"🔗 Calendar URL"},{id:"paste",label:"📋 Paste ICS"}].map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setStatus("idle");setErrMsg("");setResult(null);}} style={{flex:1,padding:"0.5rem 0.6rem",background:tab===t.id?"#fff":"transparent",border:`1px solid ${tab===t.id?C.border:"transparent"}`,borderRadius:"4px",color:tab===t.id?C.cream:C.muted,fontSize:"0.75rem",cursor:"pointer",transition:"all 0.15s",fontWeight:tab===t.id?500:400}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* File upload */}
          {tab==="file"&&(
            <div>
              <label style={{display:"block",border:`2px dashed ${C.border}`,borderRadius:"8px",padding:"2.5rem",textAlign:"center",cursor:"pointer",transition:"border-color 0.2s,background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <input type="file" accept=".ics,text/calendar" onChange={handleFile} style={{display:"none"}}/>
                <div style={{fontSize:"2.2rem",marginBottom:"0.6rem"}}>📅</div>
                <div style={{fontSize:"0.88rem",color:"#0E2B1F",marginBottom:"0.3rem"}}>Drop your .ics file here or click to browse</div>
                <div style={{fontSize:"0.72rem",color:C.muted}}>Supports any standard iCalendar (.ics) file</div>
              </label>
            </div>
          )}

          {/* URL */}
          {tab==="url"&&(
            <div>
              <div style={{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.4rem"}}>Calendar Feed URL</div>
              <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.6rem"}}>
                <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/…"
                  style={{flex:1,background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.75rem 1rem",color:"#1C1C1C",fontSize:"0.85rem",outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}
                  onKeyDown={e=>e.key==="Enter"&&handleUrl()}/>
                <button onClick={handleUrl} disabled={status==="loading"} style={{padding:"0.75rem 1.2rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:600,fontSize:"0.8rem",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
                  {status==="loading"?"…":"Fetch"}
                </button>
              </div>
              <div style={{fontSize:"0.7rem",color:C.muted,lineHeight:1.6}}>
                Note: In this demo environment, URL fetching is simulated due to browser security restrictions. In production deployment, a server-side proxy handles live iCal feeds.
              </div>
            </div>
          )}

          {/* Paste */}
          {tab==="paste"&&(
            <div>
              <div style={{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.muted,marginBottom:"0.4rem"}}>Paste .ics content</div>
              <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} rows={8} placeholder={"BEGIN:VCALENDAR\nVERSION:2.0\n...\nEND:VCALENDAR"}
                style={{width:"100%",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.75rem 1rem",color:"#1C1C1C",fontSize:"0.78rem",outline:"none",fontFamily:"monospace",resize:"vertical",lineHeight:1.5}}
                onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
              <button onClick={handlePaste} style={{marginTop:"0.6rem",padding:"0.65rem 1.4rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:600,fontSize:"0.8rem",cursor:"pointer"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>Parse Calendar</button>
            </div>
          )}

          {/* Loading */}
          {status==="loading"&&(
            <div style={{textAlign:"center",padding:"1.5rem 0",animation:"fadeIn 0.2s ease"}}>
              <div style={{width:"36px",height:"36px",border:`3px solid ${C.goldDim}`,borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 0.8rem"}}/>
              <div style={{fontSize:"0.83rem",color:C.muted}}>Parsing calendar…</div>
            </div>
          )}

          {/* Error */}
          {status==="error"&&(
            <div style={{marginTop:"0.8rem",padding:"0.75rem 1rem",background:"rgba(224,82,82,0.08)",border:"1px solid rgba(224,82,82,0.2)",borderRadius:"6px",fontSize:"0.8rem",color:C.error}}>
              ✕ {errMsg}
            </div>
          )}

          {/* Results */}
          {status==="done"&&result&&(
            <div style={{marginTop:"1rem",animation:"fadeIn 0.3s ease"}}>
              {result.isDemo&&(
                <div style={{padding:"0.6rem 0.9rem",background:"rgba(100,160,220,0.1)",border:"1px solid rgba(100,160,220,0.25)",borderRadius:"5px",fontSize:"0.73rem",color:"#64A0DC",marginBottom:"0.8rem"}}>
                  ⚡ Demo mode — showing simulated Airbnb import data. In production, live URLs are fetched server-side.
                </div>
              )}
              {/* Summary */}
              <div style={{background:C.successDim,border:"1px solid rgba(76,175,125,0.25)",borderRadius:"8px",padding:"1rem 1.2rem",marginBottom:"1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem"}}>
                  <span style={{fontSize:"0.78rem",color:C.success,fontWeight:600}}>✓ Calendar parsed successfully</span>
                  <span style={{fontSize:"0.72rem",color:C.muted}}>{result.events.length} event{result.events.length!==1?"s":""} · {result.dates.length} dates</span>
                </div>
                {/* Event list */}
                <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",maxHeight:"180px",overflowY:"auto"}}>
                  {result.events.map((ev,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.4rem 0.7rem",background:"rgba(10,10,15,0.3)",borderRadius:"4px",fontSize:"0.75rem"}}>
                      <span style={{color:C.mutedLight,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:"0.5rem"}}>{ev.summary}</span>
                      <span style={{color:C.muted,flexShrink:0}}>{fmtDate(ev.start)} – {fmtDate(ev.end)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* New dates preview */}
              <div style={{fontSize:"0.72rem",color:C.muted,marginBottom:"1rem"}}>
                {result.dates.filter(d=>!(listing.bookedDates||[]).includes(d)).length} new dates will be added to this listing's calendar.
              </div>
              {/* Action buttons */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
                <button onClick={()=>handleApply("merge")} style={{padding:"0.85rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontWeight:700,fontSize:"0.8rem",cursor:"pointer",transition:"background 0.2s",letterSpacing:"0.05em"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>
                  ⊕ Merge with existing
                </button>
                <button onClick={()=>handleApply("replace")} style={{padding:"0.85rem",background:"rgba(224,82,82,0.12)",color:C.error,border:"1px solid rgba(224,82,82,0.25)",borderRadius:"6px",fontWeight:600,fontSize:"0.8rem",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(224,82,82,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(224,82,82,0.12)";}}>
                  ↺ Replace all blocked dates
                </button>
              </div>
              <div style={{fontSize:"0.68rem",color:C.muted,marginTop:"0.5rem",textAlign:"center"}}>
                Merge keeps existing blocks. Replace clears them first.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Per-listing iCal card ─────────────────────────────────────────
function ICalListingRow({ listing, bookings, syncConfigs, onImport, onExport, onRemoveSync, onListingUpdate }) {
  const [expanded,setExpanded]=useState(false);
  const [showImport,setShowImport]=useState(null); // platform id
  const configs = (syncConfigs[listing.id] || []);
  const lBookings = bookings.filter(b=>b.listing?.id===listing.id);

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",overflow:"hidden",marginBottom:"1rem",transition:"all 0.2s",boxShadow:"0 2px 10px rgba(14,43,31,0.06)"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
      {/* Row header */}
      <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.4rem",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <img src={listing.photos[0]} alt="" style={{width:"52px",height:"40px",objectFit:"cover",borderRadius:"5px",flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",color:"#0E2B1F",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{listing.name}</div>
          <div style={{fontSize:"0.72rem",color:C.muted,marginTop:"0.1rem"}}>{listing.neighborhood} · {(listing.bookedDates||[]).length} blocked dates · {configs.length} sync{configs.length!==1?"s":""} connected</div>
        </div>
        {/* Export button */}
        <button onClick={e=>{e.stopPropagation();onExport(listing,lBookings);}} style={{padding:"0.4rem 0.9rem",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"4px",color:C.muted,fontSize:"0.72rem",cursor:"pointer",transition:"all 0.2s",flexShrink:0,display:"flex",alignItems:"center",gap:"0.35rem"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
          ↓ Export .ics
        </button>
        <span style={{color:C.muted,fontSize:"0.9rem",transition:"transform 0.2s",transform:expanded?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▾</span>
      </div>

      {/* Expanded detail */}
      {expanded&&(
        <div style={{borderTop:`1px solid ${C.border}`,padding:"1.2rem 1.4rem",animation:"fadeIn 0.25s ease",background:"#FDFAF5"}}>
          {/* Connected feeds */}
          {configs.length>0&&(
            <div style={{marginBottom:"1.2rem"}}>
              <div style={{fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.6rem"}}>Connected Calendar Feeds</div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
                {configs.map((cfg,i)=>{
                  const p=PLATFORMS.find(p=>p.id===cfg.platform)||PLATFORMS[PLATFORMS.length-1];
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.6rem 0.9rem",background:C.ink,borderRadius:"6px",border:`1px solid ${C.border}`}}>
                      <span style={{fontSize:"1rem"}}>{p.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"0.8rem",color:"#0E2B1F",fontWeight:500}}>{p.name}</div>
                        <div style={{fontSize:"0.65rem",color:C.muted,marginTop:"0.1rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cfg.source||"File import"} · Last synced: {cfg.lastSynced?new Date(cfg.lastSynced).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Never"}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
                        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.success}}/>
                        <span style={{fontSize:"0.65rem",color:C.success}}>Active</span>
                      </div>
                      <button onClick={()=>onRemoveSync(listing.id,i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"0.8rem",padding:"0.2rem"}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted} title="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Import from platforms */}
          <div style={{marginBottom:"1.2rem"}}>
            <div style={{fontSize:"0.62rem",letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:"0.7rem"}}>Import From Platform</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.5rem"}}>
              {PLATFORMS.map(p=>(
                <button key={p.id} onClick={()=>setShowImport(p.id)} style={{padding:"0.6rem 0.8rem",background:"#F7F2EA",border:`1px solid ${C.border}`,borderRadius:"6px",cursor:"pointer",transition:"all 0.2s",textAlign:"left",display:"flex",alignItems:"center",gap:"0.5rem"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color+"88";e.currentTarget.style.background="rgba(197,151,58,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="#F7F2EA";}}>
                  <span style={{fontSize:"1rem"}}>{p.icon}</span>
                  <span style={{fontSize:"0.73rem",color:C.mutedLight,fontWeight:500}}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap"}}>
            {[
              {l:"Blocked dates",v:(listing.bookedDates||[]).length},
              {l:"Future blocked",v:(listing.bookedDates||[]).filter(d=>d>=toKey(new Date())).length},
              {l:"Confirmed bookings",v:lBookings.length},
            ].map(s=>(
              <div key={s.l} style={{padding:"0.5rem 0.9rem",background:C.ink,borderRadius:"5px",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:"0.58rem",color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{s.l}</div>
                <div style={{fontSize:"0.95rem",color:C.gold,fontWeight:600,marginTop:"0.1rem"}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport&&(
        <ImportModal
          listing={listing}
          platform={showImport}
          onClose={()=>setShowImport(null)}
          onImport={({listing:l,result,mode})=>{
            onImport({listing:l,result,mode,platform:showImport});
            setShowImport(null);
          }}
        />
      )}
    </div>
  );
}

// ── iCal Sync Manager (main panel) ───────────────────────────────
function ICalSyncManager({ listings, bookings, onListingUpdate }) {
  const [syncConfigs,setSyncConfigs]=useState({});
  const [syncLog,setSyncLog]=useState([]);
  const [toast,setToast]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    Promise.all([loadSyncConfigs(),loadSyncLog()]).then(([cfg,log])=>{
      setSyncConfigs(cfg); setSyncLog(log); setLoaded(true);
    });
  },[]);

  const handleExport=(listing,lBookings)=>{
    const ics=generateICS(listing,lBookings);
    downloadICS(`${listing.name.replace(/\s+/g,"-")}-shikaz.ics`,ics);
    setToast({msg:`Exported calendar for ${listing.name}`,type:"success"});
  };

  const handleImport=async({listing,result,mode,platform})=>{
    const newDates = result.dates;
    let finalDates;
    if(mode==="replace") {
      finalDates = [...new Set(newDates)].sort();
    } else {
      finalDates = [...new Set([...(listing.bookedDates||[]),...newDates])].sort();
    }
    // Update listing
    const updated = {...listing, bookedDates: finalDates};
    await onListingUpdate(updated);
    // Save sync config
    const p = PLATFORMS.find(p=>p.id===platform)||PLATFORMS[PLATFORMS.length-1];
    const newCfg = {
      platform, source: result.source||"File", lastSynced: new Date().toISOString(),
      eventsCount: result.events.length, datesCount: newDates.length,
    };
    const updatedConfigs = {
      ...syncConfigs,
      [listing.id]: [...(syncConfigs[listing.id]||[]).filter(c=>c.platform!==platform), newCfg],
    };
    setSyncConfigs(updatedConfigs);
    await saveSyncConfigs(updatedConfigs);
    // Log entry
    const logEntry = {
      ts: new Date().toISOString(), listingName: listing.name,
      platform: p.name, events: result.events.length,
      datesAdded: finalDates.length-(listing.bookedDates||[]).length,
      mode,
    };
    const newLog = [logEntry, ...syncLog].slice(0,50);
    setSyncLog(newLog);
    await saveSyncLog(newLog);
    setToast({msg:`Imported ${result.events.length} events → ${listing.name} (${mode})`,type:"success"});
  };

  const handleRemoveSync=async(listingId,idx)=>{
    const updated={...syncConfigs,[listingId]:(syncConfigs[listingId]||[]).filter((_,i)=>i!==idx)};
    setSyncConfigs(updated);
    await saveSyncConfigs(updated);
    setToast({msg:"Sync connection removed.",type:"success"});
  };

  if(!loaded) return <div style={{textAlign:"center",padding:"4rem",color:C.muted}}>Loading…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:"0.4rem"}}>Calendar Sync</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",color:"#0E2B1F",fontWeight:400}}>iCal Sync</h2>
        <p style={{fontSize:"0.82rem",color:C.muted,marginTop:"0.3rem",lineHeight:1.7,maxWidth:"580px"}}>
          Import blocked dates from Airbnb, Booking.com, VRBO and others. Export your calendar for any platform. Keep all your channels in sync.
        </p>
      </div>

      {/* How it works */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.8rem",marginBottom:"2rem"}}>
        {[
          {icon:"⬇️",title:"Import",desc:"Upload or paste an .ics file from any OTA platform. Blocked dates sync instantly."},
          {icon:"⬆️",title:"Export",desc:"Download your calendar as a .ics file. Add the URL to any platform that supports iCal."},
          {icon:"🔄",title:"Stay in sync",desc:"Re-import whenever you get new bookings on other platforms. Merge or replace at will."},
        ].map(s=>(
          <div key={s.title} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"1.1rem",boxShadow:"0 2px 8px rgba(14,43,31,0.06)"}}>
            <div style={{fontSize:"1.4rem",marginBottom:"0.5rem"}}>{s.icon}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"0.9rem",color:"#0E2B1F",marginBottom:"0.3rem",fontWeight:500}}>{s.title}</div>
            <div style={{fontSize:"0.75rem",color:C.muted,lineHeight:1.6}}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Platform badges */}
      <div style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"1.8rem",flexWrap:"wrap"}}>
        <span style={{fontSize:"0.68rem",color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase"}}>Supported:</span>
        {PLATFORMS.filter(p=>p.id!=="manual").map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:"0.35rem",padding:"0.25rem 0.65rem",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:"20px",fontSize:"0.7rem",color:C.mutedLight}}>
            <span>{p.icon}</span>{p.name}
          </div>
        ))}
      </div>

      {/* Per-listing rows */}
      <div>
        {listings.map(l=>(
          <ICalListingRow
            key={l.id}
            listing={l}
            bookings={bookings}
            syncConfigs={syncConfigs}
            onImport={handleImport}
            onExport={handleExport}
            onRemoveSync={handleRemoveSync}
            onListingUpdate={onListingUpdate}
          />
        ))}
      </div>

      {/* Sync Log */}
      {syncLog.length>0&&(
        <div style={{marginTop:"2rem"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",marginBottom:"1rem",fontWeight:400}}>Sync History</div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"8px",overflow:"hidden",boxShadow:"0 4px 16px rgba(14,43,31,0.08)"}}>
            {syncLog.slice(0,12).map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1.2rem",borderBottom:i<syncLog.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap",gap:"0.5rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.success,flexShrink:0}}/>
                  <div>
                    <span style={{fontSize:"0.8rem",color:"#0E2B1F"}}>{e.listingName}</span>
                    <span style={{fontSize:"0.75rem",color:C.muted,marginLeft:"0.5rem"}}>← {e.platform}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:"1rem",fontSize:"0.72rem",color:C.muted}}>
                  <span>{e.events} events</span>
                  <span style={{color:e.datesAdded>0?C.success:C.muted}}>{e.datesAdded>0?`+${e.datesAdded} dates`:"No new dates"}</span>
                  <span style={{color:C.muted}}>{new Date(e.ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ── Admin Shell ───────────────────────────────────────────────────
function AdminDashboard({ listings, bookings, onNavigate, onListingUpdate, onListingCreate, onListingDelete, promoConfig, onPromoSave, siteContent, onSiteContentSave }) {
  const [tab,setTab]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(true);

  const tabs=[
    {id:"dashboard",icon:"▦",label:"Dashboard"},
    {id:"bookings",icon:"📅",label:"Bookings"},
    {id:"listings",icon:"🏠",label:"Listings"},
    {id:"promos",icon:"🎉",label:"Promotions"},
    {id:"content",icon:"✏️",label:"Site Content"},
    {id:"ical",icon:"🔄",label:"iCal Sync"},
    {id:"settings",icon:"⚙",label:"Settings"},
  ];

  const handleLogout=()=>{ onNavigate("home"); };

  return (
    <div style={{minHeight:"100vh",background:"#FDFAF5",display:"flex",paddingTop:"72px"}}>
      {/* Sidebar */}
      <div style={{width:sideOpen?"230px":"64px",flexShrink:0,background:"#0E2B1F",borderRight:"1px solid rgba(197,151,58,0.2)",transition:"width 0.3s ease",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {/* Sidebar header */}
        <div style={{padding:"1.2rem",borderBottom:"1px solid rgba(197,151,58,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",minWidth:"230px"}}>
          {sideOpen&&<div style={{fontSize:"0.65rem",letterSpacing:"0.25em",textTransform:"uppercase",color:C.gold}}>Host Portal</div>}
          <button onClick={()=>setSideOpen(s=>!s)} style={{background:"none",border:"none",color:"rgba(247,242,234,0.6)",cursor:"pointer",fontSize:"1.1rem",padding:"0.2rem",lineHeight:1,marginLeft:"auto"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>
            {sideOpen?"◁":"▷"}
          </button>
        </div>
        {/* Nav items */}
        <nav style={{padding:"0.8rem 0",flex:1}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.8rem 1.2rem",background:tab===t.id?"rgba(197,151,58,0.15)":"transparent",border:"none",borderLeft:`2px solid ${tab===t.id?C.gold:"transparent"}`,color:tab===t.id?C.gold:"rgba(247,242,234,0.65)",cursor:"pointer",transition:"all 0.2s",textAlign:"left",minWidth:"230px",whiteSpace:"nowrap"}} onMouseEnter={e=>{ if(tab!==t.id){ e.currentTarget.style.background="rgba(197,151,58,0.08)"; e.currentTarget.style.color="rgba(247,242,234,0.85)"; }}} onMouseLeave={e=>{ if(tab!==t.id){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.muted; }}}>
              <span style={{fontSize:"1rem",flexShrink:0}}>{t.icon}</span>
              {sideOpen&&<span style={{fontSize:"0.83rem",fontWeight:500,letterSpacing:"0.05em"}}>{t.label}</span>}
            </button>
          ))}
        </nav>
        {/* Bottom: back to site */}
        <div style={{padding:"0.8rem",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>onNavigate("home")} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.7rem 1rem",background:"none",border:"1px solid rgba(247,242,234,0.2)",borderRadius:"5px",color:"rgba(247,242,234,0.6)",cursor:"pointer",transition:"all 0.2s",minWidth:"214px",whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            <span style={{flexShrink:0}}>←</span>
            {sideOpen&&<span style={{fontSize:"0.78rem"}}>Back to site</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:"1.5rem",animation:"fadeIn 0.3s ease",background:"#FDFAF5"}}>
        {tab==="dashboard"&&<DashboardHome listings={listings} bookings={bookings}/>}
        {tab==="bookings" &&<BookingsManager listings={listings} bookings={bookings}/>}
        {tab==="listings" &&<AdminListings listings={listings} bookings={bookings} onUpdate={onListingUpdate} onCreate={onListingCreate} onDelete={onListingDelete}/>}
        {tab==="promos"   &&<PromosManager promoConfig={promoConfig||{}} onSave={onPromoSave}/>}
        {tab==="content"  &&<SiteContentManager siteContent={siteContent} onSave={onSiteContentSave}/>}
        {tab==="ical"     &&<ICalSyncManager listings={listings} bookings={bookings} onListingUpdate={onListingUpdate}/>}
        {tab==="settings"&&<SettingsPanel onLogout={handleLogout}/>}
      </div>
    </div>
  );
}

// ── Admin Root (login gate) ───────────────────────────────────────
function AdminRoot({ listings, bookings, onNavigate, onListingUpdate, onListingCreate, onListingDelete, promoConfig, onPromoSave, siteContent, onSiteContentSave }) {
  const [authed,setAuthed]=useState(false);
  if(!authed) return <AdminLogin onLogin={()=>setAuthed(true)}/>;
  return <AdminDashboard listings={listings} bookings={bookings} onNavigate={onNavigate} onListingUpdate={onListingUpdate} onListingCreate={onListingCreate} onListingDelete={onListingDelete} promoConfig={promoConfig} onPromoSave={onPromoSave} siteContent={siteContent} onSiteContentSave={onSiteContentSave}/>;
}

// ─── FOOTER ───────────────────────────────────────────────────────
function Footer({ onNavigate, onMyBookings }) {
  return (
    <footer style={{background:"#0E2B1F",borderTop:"1px solid rgba(197,151,58,0.3)",padding:"2rem 1.5rem"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1.5rem"}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",color:"#F7F2EA",marginBottom:"0.4rem"}}>Shikaz<span style={{color:C.gold,fontStyle:"italic"}}>Homes</span></div>
          <div style={{fontSize:"0.78rem",color:"rgba(247,242,234,0.6)"}}>Premium short stays · Nairobi, Kenya</div>
        </div>
        <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
          {["Listings","About","Contact"].map(l=>(
            <button key={l} onClick={()=>onNavigate(l.toLowerCase())} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.78rem",color:"rgba(247,242,234,0.6)",letterSpacing:"0.12em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>{l}</button>
          ))}
          <button onClick={onMyBookings} style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.78rem",color:C.muted,letterSpacing:"0.12em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=C.gold} onMouseLeave={e=>e.target.style.color=C.muted}>My Bookings</button>
        </div>
        <div style={{fontSize:"0.73rem",color:"rgba(247,242,234,0.4)"}}>© 2026 Shikaz Homes · All rights reserved</div>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ─────────────────────────────────────────────────────
function HomePage({ listings, onSelect, onNavigate, promoConfig, activeHoliday, onSelectWithHoliday }) {
  const upcoming = getUpcomingHolidays(promoConfig || {}, 6);
  return (
    <>
      <Hero listings={listings} onNavigate={onNavigate}/>
      {upcoming.length > 0 && <PromoTicker holidays={upcoming}/>}
      <section style={{padding:"4rem 1.5rem",background:"#FDFAF5"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"3.5rem"}}>
            <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Featured</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,4vw,3rem)",color:"#0E2B1F",fontWeight:400}}>Handpicked <em style={{color:C.gold,fontStyle:"italic"}}>for you</em></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"1.8rem"}}>
            {listings.slice(0,3).map(l=><ListingCard key={l.id} listing={l} onClick={()=>activeHoliday&&onSelectWithHoliday?onSelectWithHoliday(l,activeHoliday):onSelect(l)} activeHoliday={activeHoliday}/>)}
          </div>
          <div style={{textAlign:"center",marginTop:"3rem"}}>
            <button onClick={()=>onNavigate("listings")} style={{background:"transparent",color:C.gold,border:`1px solid ${C.border}`,padding:"0.9rem 2.5rem",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.18em",textTransform:"uppercase",borderRadius:"2px",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.background=C.goldDim;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.background="transparent";}}>
              View All {listings.length} Listings →
            </button>
          </div>
        </div>
      </section>
      <UpcomingPromosSection promoConfig={promoConfig || {}} onNavigate={onNavigate} listings={listings} onSelectWithHoliday={onSelectWithHoliday}/>
      <section style={{padding:"4rem 1.5rem",background:"#F7F2EA"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"3.5rem"}}>
            <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Why Choose Us</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,4vw,3rem)",color:"#0E2B1F",fontWeight:400}}>The Shikaz <em style={{color:C.gold,fontStyle:"italic"}}>difference</em></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,220px),1fr))",gap:"1rem"}}>
            {[{icon:"✦",title:"Curated Spaces",desc:"Every property is personally inspected and styled — no compromises."},{icon:"⚡",title:"Fast WiFi",desc:"Fibre connectivity guaranteed in every listing."},{icon:"🔑",title:"Flexible Check-in",desc:"Self check-in on all properties. Arrive on your terms."},{icon:"🛡",title:"24/7 Support",desc:"Always reachable. Issues resolved — not escalated."}].map(f=>(
              <div key={f.title} style={{padding:"2.2rem",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"6px",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.boxShadow="0 8px 24px rgba(14,43,31,0.12)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="0 2px 12px rgba(14,43,31,0.06)";}}>
                <div style={{fontSize:"1.5rem",marginBottom:"1rem",color:C.gold}}>{f.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#0E2B1F",marginBottom:"0.7rem",fontWeight:500}}>{f.title}</div>
                <div style={{fontSize:"0.85rem",color:C.muted,lineHeight:1.7,fontWeight:300}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState("home");
  const [listings,setListings]=useState(DEFAULT_LISTINGS);
  const [bookings,setBookings]=useState([]);
  const [selectedListing,setSelectedListing]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showMyBookings,setShowMyBookings]=useState(false);
  const [promoConfig,setPromoConfig]=useState({});
  const [activeHoliday,setActiveHoliday]=useState(null);
  const [showHolidayPopup,setShowHolidayPopup]=useState(false);
  const [pendingHoliday,setPendingHoliday]=useState(null);
  const [siteContent,setSiteContent]=useState(DEFAULT_SITE_CONTENT);
  const [showConcierge,setShowConcierge]=useState(false);

  useEffect(()=>{
    Promise.all([loadListings(),loadBookings(),loadPromos(),loadSiteContent()]).then(([ls,bs,pc,sc])=>{
      setListings(ls); setBookings(bs); setPromoConfig(pc); setSiteContent(sc); setLoading(false);
      const holiday = getActiveHoliday(pc);
      if(holiday){
        setActiveHoliday(holiday);
        const seen = sessionStorage.getItem("shikaz_promo_seen_"+holiday.id);
        if(!seen){ setTimeout(()=>setShowHolidayPopup(true),2500); }
      }
    });
  },[]);

  const handlePromoSave = async(cfg) => {
    setPromoConfig(cfg);
    await savePromos(cfg);
    const holiday = getActiveHoliday(cfg);
    setActiveHoliday(holiday);
  };

  const handleSiteContentSave = async(sc) => {
    setSiteContent(sc);
    await saveSiteContent(sc);
  };

  const navigate=(p)=>{ setPage(p); window.scrollTo(0,0); };
  const selectListing=(l)=>{ setSelectedListing(l); setPage("listing"); window.scrollTo(0,0); };
  // Navigate to a listing AND pre-load a holiday discount into the booking widget
  const selectListingWithHoliday=(l, holiday)=>{
    setSelectedListing(l);
    setPendingHoliday(holiday);
    setPage("listing");
    window.scrollTo(0,0);
  };
  // Clear pendingHoliday once it's been consumed by ListingPage
  const consumePendingHoliday=()=>{ const h=pendingHoliday; setPendingHoliday(null); return h; };

  const handleListingUpdate=async(updated)=>{
    const updatedListings=listings.map(l=>l.id===updated.id?updated:l);
    setListings(updatedListings);
    await saveListings(updatedListings);
    if(selectedListing?.id===updated.id) setSelectedListing(updated);
  };

  const handleListingCreate=async(newListing)=>{
    const updatedListings=[...listings, newListing];
    setListings(updatedListings);
    await saveListings(updatedListings);
  };

  const handleListingDelete=async(id)=>{
    const updatedListings=listings.filter(l=>l.id!==id);
    setListings(updatedListings);
    await saveListings(updatedListings);
    if(selectedListing?.id===id) setSelectedListing(null);
  };

  const handleBookingMade=async(booking)=>{
    // Add booked dates to the listing
    const nights=booking.nights;
    const newDates=[];
    let cur=booking.checkIn;
    for(let i=0;i<nights;i++){
      newDates.push(cur);
      cur=addDays(cur,1);
    }
    const updatedListings=listings.map(l=>
      l.id===booking.listing.id
        ? {...l,bookedDates:[...new Set([...l.bookedDates,...newDates])]}
        : l
    );
    setListings(updatedListings);
    await saveListings(updatedListings);
    // Update selected listing view
    if(selectedListing?.id===booking.listing.id){
      setSelectedListing(updatedListings.find(l=>l.id===booking.listing.id));
    }
    const newBookings=[...bookings,booking];
    setBookings(newBookings);
    await saveBookings(newBookings);
    setShowMyBookings(true);
  };

  if(loading) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FDFAF5"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:C.sage,animation:"shimmer 1.2s ease infinite"}}>Shikaz<em>Homes</em></div>
    </div>
  );

  const handleHolidayClose = () => {
    setShowHolidayPopup(false);
    if(activeHoliday) sessionStorage.setItem("shikaz_promo_seen_"+activeHoliday.id,"1");
  };
  const handleHolidayBook = () => {
    setShowHolidayPopup(false);
    if(activeHoliday) sessionStorage.setItem("shikaz_promo_seen_"+activeHoliday.id,"1");
    // Go to first available listing with discount pre-applied
    const target = listings.find(l=>l.available);
    if(target) selectListingWithHoliday(target, activeHoliday);
    else navigate("listings");
  };

  return (
    <>
      <style>{GS}</style>
      <Nav onNavigate={navigate}/>
      {page==="home"    &&<HomePage listings={listings} onSelect={selectListing} onNavigate={navigate} promoConfig={promoConfig} activeHoliday={activeHoliday} onSelectWithHoliday={selectListingWithHoliday}/>}
      {page==="listings"&&<ListingsPage listings={listings} onSelect={selectListing} promoConfig={promoConfig} activeHoliday={activeHoliday} onSelectWithHoliday={selectListingWithHoliday}/>}
      {page==="listing" &&selectedListing&&<ListingPage listing={selectedListing} onBack={()=>navigate("listings")} onNavigate={navigate} onBookingMade={handleBookingMade} activeHoliday={pendingHoliday||activeHoliday}/>}
      {page==="about"   &&<AboutPage siteContent={siteContent}/>}
      {page==="contact" &&<ContactPage siteContent={siteContent}/>}
      {page==="mybooking"&&<MyBookingPage bookings={bookings}/>}
      {page==="admin"   &&<AdminRoot listings={listings} bookings={bookings} onNavigate={navigate} onListingUpdate={handleListingUpdate} onListingCreate={handleListingCreate} onListingDelete={handleListingDelete} promoConfig={promoConfig} onPromoSave={handlePromoSave} siteContent={siteContent} onSiteContentSave={handleSiteContentSave}/>}
      {page!=="home"&&page!=="admin"&&<Footer onNavigate={navigate} onMyBookings={()=>setShowMyBookings(true)}/>}
      {page==="home"    &&<Footer onNavigate={navigate} onMyBookings={()=>setShowMyBookings(true)}/>}
      {showMyBookings&&<MyBookingsPanel bookings={bookings} onClose={()=>setShowMyBookings(false)}/>}
      {showHolidayPopup&&activeHoliday&&page!=="admin"&&(
        <HolidayPopup holiday={activeHoliday} onClose={handleHolidayClose} onBook={handleHolidayBook}/>
      )}
      {!showHolidayPopup&&activeHoliday&&page!=="admin"&&(
        <PromoBanner holiday={activeHoliday} onOpen={()=>setShowHolidayPopup(true)}/>
      )}
      {page!=="admin"&&(
        <ShikazConcierge
          listing={page==="listing"?selectedListing:null}
          siteContent={siteContent}
        />
      )}
    </>
  );
}
