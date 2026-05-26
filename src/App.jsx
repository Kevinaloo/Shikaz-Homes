import { useState, useEffect, useCallback } from "react";
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
    bookedDates:["2026-06-03","2026-06-04","2026-06-05","2026-06-12","2026-06-13"] },
  { id:"lst-002", name:"Kilimani Garden Studio", neighborhood:"Kilimani", city:"Nairobi",
    tagline:"Leafy calm in the heart of the city", type:"Studio",
    bedrooms:1, bathrooms:1, guests:2, sqm:45, pricePerNight:3200, cleaningFee:800,
    rating:4.91, reviewCount:132, badge:"Popular", available:true,
    amenities:["WiFi","Smart TV","Netflix","Kitchenette","Garden Access","Secure Parking","Security"],
    photos:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=85","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=85","https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=85"],
    description:"A beautifully designed studio tucked behind lush gardens in Kilimani — one of Nairobi's most coveted addresses. Minimalist interiors with warm wood tones, a queen bed, and a fully-fitted kitchenette. Walk to Java, Carrefour and the best cafes in under 5 minutes.\n\nIdeal for solo travellers or couples on short business or leisure stays.",
    houseRules:["No smoking","No parties","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-08","2026-06-09","2026-06-20","2026-06-21","2026-06-22"] },
  { id:"lst-003", name:"Lavington Family Retreat", neighborhood:"Lavington", city:"Nairobi",
    tagline:"Space, comfort & a garden for the whole family", type:"2-Bedroom Apartment",
    bedrooms:2, bathrooms:2, guests:5, sqm:130, pricePerNight:11000, cleaningFee:2000,
    rating:4.94, reviewCount:57, badge:"New", available:true,
    amenities:["WiFi","Smart TV","Full Kitchen","Washing Machine","Kids Play Area","Private Garden","Parking","Security","Netflix","Air Conditioning"],
    photos:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85","https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=85","https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&q=85","https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=85"],
    description:"Nairobi's most family-friendly short stay. This generous 2-bedroom apartment sits in a quiet compound in Lavington, with a private garden, fully equipped kitchen, and laundry. Space for everyone — adults and children alike.\n\nClose to Lavington Mall, international schools, and a short drive from the CBD.",
    houseRules:["No smoking","Quiet hours 10PM–7AM","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-15","2026-06-16","2026-06-17","2026-06-28","2026-06-29"] },
  { id:"lst-004", name:"Parklands Executive Suite", neighborhood:"Parklands", city:"Nairobi",
    tagline:"Corporate-grade comfort in a quiet enclave", type:"1-Bedroom Suite",
    bedrooms:1, bathrooms:1, guests:2, sqm:65, pricePerNight:5500, cleaningFee:1000,
    rating:4.88, reviewCount:96, badge:"Business Pick", available:true,
    amenities:["WiFi","Workspace","Smart TV","Kitchen","Gym","Pool","Parking","Security","Iron & Board"],
    photos:["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85","https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=85","https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&q=85","https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200&q=85"],
    description:"Purpose-built for the business traveller who refuses to compromise. A crisp, modern 1-bedroom suite with a dedicated workspace, high-speed fibre WiFi, and a fully equipped kitchen. The building has a pool and gym — unwind after a long day in Nairobi.\n\nClose to Aga Khan Hospital, UN offices, and Westlands business district.",
    houseRules:["No smoking","No parties","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-02","2026-06-10","2026-06-11","2026-06-25"] },
  { id:"lst-005", name:"Riverside Loft", neighborhood:"Riverside", city:"Nairobi",
    tagline:"Industrial chic meets Nairobi's creative quarter", type:"Loft Studio",
    bedrooms:1, bathrooms:1, guests:2, sqm:60, pricePerNight:4800, cleaningFee:1000,
    rating:4.93, reviewCount:43, badge:"Design Pick", available:true,
    amenities:["WiFi","Smart TV","Kitchenette","Art Collection","River View","Secure Access","Netflix"],
    photos:["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=85","https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=85","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=85","https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&q=85"],
    description:"A double-height loft in the creative Riverside neighbourhood. Exposed concrete, warm pendant lighting, and curated local art make this a truly memorable space. The bed sits on a mezzanine above an open living area with river-facing windows.\n\nFive minutes from Nairobi's best restaurants and gallery spaces.",
    houseRules:["No smoking","No parties","Respect art pieces","Check-in 2PM","Checkout 11AM"],
    bookedDates:["2026-06-06","2026-06-07","2026-06-18","2026-06-19"] },
  { id:"lst-006", name:"Karen Countryside Villa", neighborhood:"Karen", city:"Nairobi",
    tagline:"A private villa among acacia and bougainvillea", type:"3-Bedroom Villa",
    bedrooms:3, bathrooms:3, guests:7, sqm:280, pricePerNight:22000, cleaningFee:4000,
    rating:4.99, reviewCount:28, badge:"Luxury", available:true,
    amenities:["WiFi","Smart TV","Full Kitchen","Private Pool","BBQ","Gardener","Housekeeper","Parking x4","Generator","Air Conditioning","Netflix","Fireplace"],
    photos:["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85","https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=85","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85","https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&q=85"],
    description:"The crown jewel of Shikaz Homes. Set on half an acre in Karen, this three-bedroom villa offers absolute privacy, a heated private pool, outdoor BBQ and a fully staffed experience. Mornings begin with garden breakfasts and sunsets end by the fireplace.\n\nIdeal for families, special celebrations, and executives seeking a genuine retreat.",
    houseRules:["No loud music after 10PM","Max 7 guests","No smoking indoors","Check-in 3PM","Checkout 11AM"],
    bookedDates:["2026-06-01","2026-06-14","2026-06-30"] },
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
function PaymentModal({ listing, checkIn, checkOut, guests, onClose, onSuccess }) {
  const nights  = nightsBetween(checkIn,checkOut);
  const total   = nights*listing.pricePerNight + listing.cleaningFee;
  const [step,setStep]=useState("form"); // form | sending | confirm | success | failed
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [err,setErr]=useState("");
  const ref = genRef();

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
    setTimeout(()=>{
      // 90% success rate simulation
      setStep(Math.random()>0.1?"success":"failed");
    },3500);
  };

  const handleSuccess=()=>{
    onSuccess({ ref, name, phone:normalisePhone(phone), checkIn, checkOut, guests, listing, total, nights });
    onClose();
  };

  const overlay={position:"fixed",inset:0,background:"rgba(14,43,31,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(8px)"};
  const box={background:"#fff",border:`1px solid ${C.border}`,borderRadius:"12px",width:"100%",maxWidth:"480px",padding:"2.2rem",animation:"slideUp 0.35s ease",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.6)"};

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={box}>
        <button onClick={onClose} style={{position:"absolute",top:"1rem",right:"1rem",background:"none",border:"none",color:C.muted,fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>✕</button>

        {/* Header */}
        <div style={{marginBottom:"1.5rem"}}>
          <div style={{fontSize:"0.65rem",letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(197,151,58,0.9)",marginBottom:"0.4rem"}}>
            {step==="success"?"Booking Confirmed":step==="failed"?"Payment Failed":"Secure Checkout"}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.35rem",color:"#0E2B1F"}}>{listing.name}</div>
          <div style={{fontSize:"0.8rem",color:C.muted,marginTop:"0.2rem"}}>
            {fmtDate(checkIn)} → {fmtDate(checkOut)} · {nights} night{nights>1?"s":""} · {guests} guest{guests>1?"s":""}
          </div>
        </div>

        {/* ── FORM ── */}
        {step==="form"&&(
          <div style={{animation:"fadeIn 0.3s ease"}}>
            <PriceBreakdown listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests}/>
            <div style={{marginTop:"1.2rem"}}>
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
                Continue to M-Pesa →
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
              Sending STK push to <strong style={{color:C.gold}}>+{normalisePhone(phone)}</strong>
              <br/>Please wait…
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
              {[["Listing",listing.name],["Dates",`${fmtDate(checkIn)} – ${fmtDate(checkOut)}`],["Nights",`${nights} night${nights>1?"s":""}`],["Amount",`KES ${fmt(total)}`],["Reference",ref]].map(([l,r])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",padding:"0.3rem 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.muted}}>{l}</span><span style={{color:l==="Amount"||l==="Reference"?C.gold:C.cream,fontWeight:l==="Amount"?600:400}}>{r}</span>
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
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",color:"#0E2B1F",marginBottom:"0.4rem"}}>Booking Confirmed!</div>
              <div style={{fontSize:"0.83rem",color:C.muted}}>Payment received · Confirmation sent to {normalisePhone(phone)}</div>
            </div>
            <div style={{background:C.successDim,border:`1px solid rgba(76,175,125,0.25)`,borderRadius:"8px",padding:"1.2rem",marginBottom:"1.2rem"}}>
              {[["Guest",name],["Property",listing.name],["Check-in",fmtDate(checkIn)],["Check-out",fmtDate(checkOut)],["Nights",`${nights}`],["Guests",`${guests}`],["Total Paid",`KES ${fmt(total)}`],["Booking Ref",ref]].map(([l,r])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",padding:"0.3rem 0",borderBottom:`1px solid rgba(76,175,125,0.15)`}}>
                  <span style={{color:C.muted}}>{l}</span>
                  <span style={{color:l==="Total Paid"||l==="Booking Ref"?C.success:C.cream,fontWeight:["Total Paid","Booking Ref"].includes(l)?600:400}}>{r}</span>
                </div>
              ))}
            </div>
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
              <button onClick={()=>setStep("confirm")} style={{flex:1,padding:"0.9rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"6px",fontSize:"0.8rem",fontWeight:600,cursor:"pointer"}}>Try Again</button>
              <a href="https://wa.me/254745802200" target="_blank" rel="noreferrer" style={{flex:1,padding:"0.9rem",background:"transparent",color:C.success,border:`1px solid ${C.success}`,borderRadius:"6px",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.3rem"}}>WhatsApp</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOOKING WIDGET ───────────────────────────────────────────────
function BookingWidget({ listing, onBookingMade }) {
  const [checkIn,setCheckIn]=useState(null);
  const [checkOut,setCheckOut]=useState(null);
  const [guests,setGuests]=useState(1);
  const [showCal,setShowCal]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const nights=nightsBetween(checkIn,checkOut);

  const handleSelect=({checkIn:ci,checkOut:co})=>{ setCheckIn(ci); setCheckOut(co); };

  const handleBookingSuccess=(booking)=>{
    onBookingMade(booking);
  };

  const canBook=checkIn&&checkOut&&nights>0;

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",boxShadow:"0 16px 60px rgba(14,43,31,0.12)",position:"sticky",top:"92px"}}>
      {/* Price */}
      <div style={{marginBottom:"1.2rem",display:"flex",alignItems:"baseline",gap:"0.4rem"}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",color:C.gold}}>KES {fmt(listing.pricePerNight)}</span>
        <span style={{fontSize:"0.8rem",color:C.muted}}>/night</span>
        <span style={{marginLeft:"auto",fontSize:"0.8rem",color:C.mutedLight}}>★ {listing.rating} ({listing.reviewCount})</span>
      </div>

      {/* Date display pills */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"0.8rem"}}>
        {[{label:"Check-in",val:checkIn},{label:"Check-out",val:checkOut}].map(f=>(
          <button key={f.label} onClick={()=>setShowCal(true)} style={{padding:"0.7rem 0.8rem",background:"#F7F2EA",border:`1px solid ${checkIn||checkOut?C.border:C.border}`,borderRadius:"5px",textAlign:"left",cursor:"pointer",transition:"border-color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
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
      <button onClick={()=>setShowCal(s=>!s)} style={{width:"100%",padding:"0.6rem",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:"5px",color:C.muted,fontSize:"0.75rem",fontSize:"0.75rem",cursor:"pointer",marginBottom:"0.8rem",letterSpacing:"0.1em",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.color=C.gold;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.muted;}}>
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
      {canBook&&<div style={{marginBottom:"0.8rem"}}><PriceBreakdown listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests}/></div>}

      {/* CTA */}
      <button onClick={()=>{ if(canBook) setShowModal(true); else setShowCal(true); }} style={{width:"100%",padding:"1.1rem",background:canBook?C.gold:"rgba(212,175,95,0.3)",color:canBook?C.obsidian:"rgba(212,175,95,0.6)",border:"none",borderRadius:"6px",fontSize:"0.82rem",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",cursor:canBook?"pointer":"default",transition:"all 0.2s"}} onMouseEnter={e=>{ if(canBook) e.target.style.background=C.goldLight; }} onMouseLeave={e=>{ if(canBook) e.target.style.background=C.gold; }}>
        {canBook?`Reserve · KES ${fmt(nights*listing.pricePerNight+listing.cleaningFee)}`:"Select Dates to Reserve"}
      </button>
      <p style={{textAlign:"center",fontSize:"0.7rem",color:C.muted,marginTop:"0.6rem"}}>
        {canBook?"You won't be charged until payment is confirmed":"Free cancellation · No hidden fees"}
      </p>

      {/* WhatsApp alternative */}
      <a href={`https://wa.me/254745802200?text=${encodeURIComponent(`Hi! I'd like to book ${listing.name} from ${checkIn||"TBD"} to ${checkOut||"TBD"} for ${guests} guest(s). Please confirm availability.`)}`} target="_blank" rel="noreferrer"
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginTop:"0.8rem",padding:"0.7rem",border:`1px solid rgba(76,175,125,0.3)`,borderRadius:"5px",color:"#4CAF7D",fontSize:"0.75rem",fontWeight:500,textDecoration:"none",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(76,175,125,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <span>📱</span> Book via WhatsApp instead
      </a>

      {showModal&&<PaymentModal listing={listing} checkIn={checkIn} checkOut={checkOut} guests={guests} onClose={()=>setShowModal(false)} onSuccess={handleBookingSuccess}/>}
    </div>
  );
}

// ─── LISTING CARD ─────────────────────────────────────────────────
function ListingCard({ listing, onClick }) {
  const [imgIdx,setImgIdx]=useState(0);
  const [hov,setHov]=useState(false);
  const bs=BADGE_STYLE[listing.badge]||BADGE_STYLE["Popular"];
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setImgIdx(0);}}
      style={{background:C.card,border:`1px solid ${hov?C.borderHover:C.border}`,borderRadius:"8px",overflow:"hidden",cursor:"pointer",transition:"all 0.3s ease",transform:hov?"translateY(-5px)":"translateY(0)",boxShadow:hov?"0 24px 60px rgba(14,43,31,0.18)":"0 4px 20px rgba(14,43,31,0.08)"}}>
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
        <div style={{position:"absolute",top:"0.9rem",right:"0.9rem",background:"rgba(14,43,31,0.72)",backdropFilter:"blur(8px)",borderRadius:"3px",padding:"0.25rem 0.6rem",fontSize:"0.62rem",color:listing.available?"#5EB578":C.error,fontWeight:600,display:"flex",alignItems:"center",gap:"0.3rem"}}>
          <span style={{width:"5px",height:"5px",borderRadius:"50%",background:listing.available?"#5EB578":C.error,display:"inline-block"}}/>
          {listing.available?"Available":"Booked"}
        </div>
      </div>
      <div style={{padding:"1.3rem"}}>
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
          <div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.25rem",color:C.gold,fontWeight:500}}>KES {fmt(listing.pricePerNight)}</span>
            <span style={{fontSize:"0.73rem",color:C.muted}}> /night</span>
          </div>
          <div style={{fontSize:"0.72rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.gold}}>View →</div>
        </div>
      </div>
    </div>
  );
}

// ─── LISTING PAGE ─────────────────────────────────────────────────
function ListingPage({ listing, onBack, onNavigate, onBookingMade }) {
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
          <BookingWidget listing={listing} onBookingMade={onBookingMade}/>
        </div>
      </div>
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
function ListingsPage({ listings, onSelect }) {
  const [filter,setFilter]=useState("All");
  const types=["All","Studio","1-Bedroom","2+ Bedrooms","Villa"];
  const filtered=filter==="All"?listings:listings.filter(l=>
    filter==="Villa"?l.type.toLowerCase().includes("villa"):
    filter==="Studio"?l.type.toLowerCase().includes("studio"):
    filter==="1-Bedroom"?l.bedrooms===1&&!l.type.toLowerCase().includes("studio"):
    filter==="2+ Bedrooms"?l.bedrooms>=2&&!l.type.toLowerCase().includes("villa"):true
  );
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:"#FDFAF5"}}>
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
            <div key={l.id} style={{animation:"fadeUp 0.6s ease both"}}><ListingCard listing={l} onClick={()=>onSelect(l)}/></div>
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
function AboutPage() {
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:C.obsidian}}>
      <div style={{backgroundImage:"url(https://images.unsplash.com/photo-1580139861541-0f79bb4e9b30?w=1600&q=80)",backgroundSize:"cover",backgroundPosition:"center",height:"50vh",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"rgba(14,43,31,0.6)"}}/>
        <div style={{position:"relative",zIndex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"3rem 4rem"}}>
          <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Our Story</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.5rem,5vw,4rem)",color:"#F7F2EA",fontWeight:400}}>Redefining the<br/><em style={{color:C.gold}}>Nairobi stay</em></h1>
        </div>
      </div>
      <div style={{maxWidth:"800px",margin:"0 auto",padding:"3rem 1.5rem"}}>
        {["Shikaz Homes was born from a simple belief: visitors to Nairobi deserve more than a generic hotel room. They deserve a home — one with character, comfort, and a genuine sense of place.","We curate each property personally, inspecting for quality of furniture, internet reliability, security, and that indefinable sense of 'this just feels right'.","Whether you're a solo professional on a two-week contract, a family relocating between schools, or a couple celebrating an anniversary — we have a space that will feel like yours from the moment you walk in.","Nairobi is extraordinary. We think your stay should be too."].map((p,i)=>(
          <p key={i} style={{fontSize:"1rem",color:C.mutedLight,lineHeight:1.9,marginBottom:"1.6rem",fontWeight:300}}>{p}</p>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"1rem",marginTop:"2rem"}}>
          {[{n:"2020",l:"Founded"},{n:"440+",l:"Guests hosted"},{n:"4.95",l:"Avg rating"}].map(s=>(
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

function ContactPage() {
  return (
    <div style={{minHeight:"100vh",paddingTop:"72px",background:C.obsidian}}>
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"3rem 1.5rem",background:"#FDFAF5"}}>
        <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Get in Touch</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.5rem,5vw,4rem)",color:"#0E2B1F",fontWeight:400,marginBottom:"1rem"}}>Ready to <em style={{color:C.gold}}>book?</em></h1>
        <p style={{fontSize:"0.95rem",color:C.muted,marginBottom:"3rem",lineHeight:1.8}}>Reach us on WhatsApp for the fastest response, or fill in the form below.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))",gap:"1.2rem"}}>
          {[{icon:"📱",label:"WhatsApp",val:"+254 745 802 200",link:"https://wa.me/254745802200"},{icon:"✉️",label:"Email",val:"hello@shikazhomes.co.ke",link:"mailto:hello@shikazhomes.co.ke"},{icon:"◎",label:"Location",val:"Nairobi, Kenya"},{icon:"⏰",label:"Response",val:"Within 1 hour"}].map(c=>(
            <div key={c.label} style={{padding:"1.8rem",background:"#fff",border:`1px solid ${C.border}`,borderRadius:"6px",boxShadow:"0 2px 12px rgba(14,43,31,0.06)"}}>
              <div style={{fontSize:"1.6rem",marginBottom:"0.8rem"}}>{c.icon}</div>
              <div style={{fontSize:"0.68rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.muted,marginBottom:"0.3rem"}}>{c.label}</div>
              {c.link?<a href={c.link} target="_blank" rel="noreferrer" style={{color:C.gold,fontSize:"0.95rem",fontWeight:500}}>{c.val}</a>:<div style={{color:"#F7F2EA",fontSize:"0.95rem"}}>{c.val}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
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
          <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>

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
      {/* Contact info */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1.8rem",marginBottom:"1.5rem",maxWidth:"480px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#0E2B1F",marginBottom:"0.8rem",fontWeight:400}}>Business Information</div>
        {[["Property Name","Shikaz Homes"],["WhatsApp","+254 745 802 200"],["Email","hello@shikazhomes.co.ke"],["City","Nairobi, Kenya"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:`1px solid ${C.border}`,fontSize:"0.83rem"}}>
            <span style={{color:C.muted}}>{l}</span><span style={{color:"#1C1C1C"}}>{v}</span>
          </div>
        ))}
        <div style={{marginTop:"1rem",fontSize:"0.72rem",color:C.muted}}>Contact your developer to update business information.</div>
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
  const [uploading,setUploading]=useState(false);
  const [tab,setTab]=useState("upload"); // "upload" | "url"
  const fileInputRef = useState(null);

  const addUrl=()=>{
    if(!newUrl.trim()){setErr("Enter a URL.");return;}
    if(photos.includes(newUrl.trim())){setErr("Already added.");return;}
    onChange([...photos,newUrl.trim()]);
    setNewUrl(""); setErr(""); setPreview(null);
  };

  const handleFileChange=(e)=>{
    const files=Array.from(e.target.files);
    if(!files.length) return;
    setUploading(true);
    setErr("");
    const readers=files.map(file=>new Promise((resolve,reject)=>{
      if(!file.type.startsWith("image/")){reject(new Error(`${file.name} is not an image.`));return;}
      if(file.size>10*1024*1024){reject(new Error(`${file.name} exceeds 10MB limit.`));return;}
      const reader=new FileReader();
      reader.onload=ev=>resolve(ev.target.result);
      reader.onerror=()=>reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    }));
    Promise.allSettled(readers).then(results=>{
      const succeeded=results.filter(r=>r.status==="fulfilled").map(r=>r.value);
      const failed=results.filter(r=>r.status==="rejected").map(r=>r.reason.message);
      if(succeeded.length) onChange([...photos,...succeeded]);
      if(failed.length) setErr(failed.join(" "));
      setUploading(false);
      e.target.value="";
    });
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
            <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",background:"rgba(14,43,31,0.85)"}}>
              <button onClick={()=>moveUp(i)} disabled={i===0} style={{flex:1,background:"none",border:"none",color:i===0?C.muted:C.mutedLight,cursor:i===0?"default":"pointer",padding:"0.3rem",fontSize:"0.9rem",transition:"color 0.15s"}} onMouseEnter={e=>{if(i>0)e.target.style.color=C.gold;}} onMouseLeave={e=>e.target.style.color=i===0?C.muted:C.mutedLight} title="Move left">←</button>
              <button onClick={()=>moveDown(i)} disabled={i===photos.length-1} style={{flex:1,background:"none",border:"none",color:i===photos.length-1?C.muted:C.mutedLight,cursor:i===photos.length-1?"default":"pointer",padding:"0.3rem",fontSize:"0.9rem",transition:"color 0.15s"}} onMouseEnter={e=>{if(i<photos.length-1)e.target.style.color=C.gold;}} onMouseLeave={e=>e.target.style.color=i===photos.length-1?C.muted:C.mutedLight} title="Move right">→</button>
              <button onClick={()=>remove(i)} style={{flex:1,background:"none",border:"none",color:C.muted,cursor:"pointer",padding:"0.3rem",fontSize:"0.85rem",transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color=C.error} onMouseLeave={e=>e.target.style.color=C.muted} title="Remove">✕</button>
            </div>
          </div>
        ))}
        {photos.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2rem",color:C.muted,fontSize:"0.82rem",border:`1px dashed ${C.border}`,borderRadius:"6px"}}>No photos yet. Upload photos or add an image URL below.</div>}
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:"0",marginBottom:"0.8rem",border:`1px solid ${C.border}`,borderRadius:"6px",overflow:"hidden"}}>
        {[{id:"upload",label:"📁 Upload Photos"},{id:"url",label:"🔗 Add by URL"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setErr("");}} style={{flex:1,padding:"0.6rem 0.8rem",background:tab===t.id?C.gold:"transparent",color:tab===t.id?C.obsidian:C.muted,border:"none",cursor:"pointer",fontSize:"0.75rem",fontWeight:tab===t.id?700:400,letterSpacing:"0.08em",transition:"all 0.2s"}}>{t.label}</button>
        ))}
      </div>

      {/* Upload tab */}
      {tab==="upload"&&(
        <div>
          <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.6rem",padding:"2rem 1.5rem",border:`2px dashed ${C.gold}`,borderRadius:"8px",background:"rgba(197,151,58,0.04)",cursor:uploading?"not-allowed":"pointer",transition:"background 0.2s"}}
            onMouseEnter={e=>{if(!uploading)e.currentTarget.style.background="rgba(197,151,58,0.09)";}}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(197,151,58,0.04)"}>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} style={{display:"none"}}/>
            {uploading
              ? <><div style={{fontSize:"1.5rem",animation:"spin 1s linear infinite"}}>⏳</div><div style={{fontSize:"0.82rem",color:C.muted}}>Processing photos…</div></>
              : <><div style={{fontSize:"2rem"}}>📷</div>
                  <div style={{fontSize:"0.9rem",fontWeight:600,color:C.sage}}>Click to choose photos</div>
                  <div style={{fontSize:"0.75rem",color:C.muted,textAlign:"center"}}>JPG, PNG, WEBP · Up to 10MB each · Multiple allowed</div></>
            }
          </label>
        </div>
      )}

      {/* URL tab */}
      {tab==="url"&&(
        <div>
          <div style={{display:"flex",gap:"0.6rem",marginBottom:"0.5rem"}}>
            <input value={newUrl} onChange={e=>{setNewUrl(e.target.value);setErr("");setPreview(e.target.value.trim()||null);}}
              placeholder="https://images.unsplash.com/…" style={{...field,flex:1}}
              onFocus={fieldFocus} onBlur={fieldBlur}
              onKeyDown={e=>e.key==="Enter"&&addUrl()}/>
            <button onClick={addUrl} style={{padding:"0.75rem 1.2rem",background:C.gold,color:C.obsidian,border:"none",borderRadius:"5px",fontWeight:600,cursor:"pointer",fontSize:"0.82rem",flexShrink:0,transition:"background 0.2s"}} onMouseEnter={e=>e.target.style.background=C.goldLight} onMouseLeave={e=>e.target.style.background=C.gold}>Add</button>
          </div>
          {preview&&(
            <div style={{marginTop:"0.6rem",borderRadius:"6px",overflow:"hidden",height:"80px",border:`1px solid ${C.border}`}}>
              <img src={preview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/>
            </div>
          )}
          <div style={{fontSize:"0.7rem",color:C.muted,marginTop:"0.5rem"}}>Tip: Use Unsplash URLs (…unsplash.com/photo-…?w=1200&q=85) for best quality.</div>
        </div>
      )}

      {err&&<div style={{fontSize:"0.75rem",color:C.error,marginTop:"0.5rem",padding:"0.4rem 0.7rem",background:"rgba(220,38,38,0.07)",borderRadius:"4px",border:"1px solid rgba(220,38,38,0.18)"}}>{err}</div>}
      <div style={{fontSize:"0.7rem",color:C.muted,marginTop:"0.6rem"}}>First photo is used as the cover image on listing cards.</div>
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
function AdminDashboard({ listings, bookings, onNavigate, onListingUpdate, onListingCreate, onListingDelete }) {
  const [tab,setTab]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(true);

  const tabs=[
    {id:"dashboard",icon:"▦",label:"Dashboard"},
    {id:"bookings",icon:"📅",label:"Bookings"},
    {id:"listings",icon:"🏠",label:"Listings"},
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
        {tab==="ical"     &&<ICalSyncManager listings={listings} bookings={bookings} onListingUpdate={onListingUpdate}/>}
        {tab==="settings"&&<SettingsPanel onLogout={handleLogout}/>}
      </div>
    </div>
  );
}

// ── Admin Root (login gate) ───────────────────────────────────────
function AdminRoot({ listings, bookings, onNavigate, onListingUpdate, onListingCreate, onListingDelete }) {
  const [authed,setAuthed]=useState(false);
  if(!authed) return <AdminLogin onLogin={()=>setAuthed(true)}/>;
  return <AdminDashboard listings={listings} bookings={bookings} onNavigate={onNavigate} onListingUpdate={onListingUpdate} onListingCreate={onListingCreate} onListingDelete={onListingDelete}/>;
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
function HomePage({ listings, onSelect, onNavigate }) {
  return (
    <>
      <Hero listings={listings} onNavigate={onNavigate}/>
      <section style={{padding:"4rem 1.5rem",background:"#FDFAF5"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"3.5rem"}}>
            <div style={{fontSize:"0.68rem",letterSpacing:"0.35em",textTransform:"uppercase",color:C.gold,marginBottom:"0.8rem"}}>Featured</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,4vw,3rem)",color:"#0E2B1F",fontWeight:400}}>Handpicked <em style={{color:C.gold,fontStyle:"italic"}}>for you</em></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"1.8rem"}}>
            {listings.slice(0,3).map(l=><ListingCard key={l.id} listing={l} onClick={()=>onSelect(l)}/>)}
          </div>
          <div style={{textAlign:"center",marginTop:"3rem"}}>
            <button onClick={()=>onNavigate("listings")} style={{background:"transparent",color:C.gold,border:`1px solid ${C.border}`,padding:"0.9rem 2.5rem",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.18em",textTransform:"uppercase",borderRadius:"2px",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.gold;e.target.style.background=C.goldDim;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.background="transparent";}}>
              View All {listings.length} Listings →
            </button>
          </div>
        </div>
      </section>
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

  useEffect(()=>{
    Promise.all([loadListings(),loadBookings()]).then(([ls,bs])=>{
      setListings(ls); setBookings(bs); setLoading(false);
    });
  },[]);

  const navigate=(p)=>{ setPage(p); window.scrollTo(0,0); };
  const selectListing=(l)=>{ setSelectedListing(l); setPage("listing"); window.scrollTo(0,0); };

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

  return (
    <>
      <style>{GS}</style>
      <Nav onNavigate={navigate}/>
      {page==="home"    &&<HomePage listings={listings} onSelect={selectListing} onNavigate={navigate}/>}
      {page==="listings"&&<ListingsPage listings={listings} onSelect={selectListing}/>}
      {page==="listing" &&selectedListing&&<ListingPage listing={selectedListing} onBack={()=>navigate("listings")} onNavigate={navigate} onBookingMade={handleBookingMade}/>}
      {page==="about"   &&<AboutPage/>}
      {page==="contact" &&<ContactPage/>}
      {page==="admin"   &&<AdminRoot listings={listings} bookings={bookings} onNavigate={navigate} onListingUpdate={handleListingUpdate} onListingCreate={handleListingCreate} onListingDelete={handleListingDelete}/>}
      {page!=="home"&&page!=="admin"&&<Footer onNavigate={navigate} onMyBookings={()=>setShowMyBookings(true)}/>}
      {page==="home"    &&<Footer onNavigate={navigate} onMyBookings={()=>setShowMyBookings(true)}/>}
      {showMyBookings&&<MyBookingsPanel bookings={bookings} onClose={()=>setShowMyBookings(false)}/>}
    </>
  );
}
